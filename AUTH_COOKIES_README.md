# Authentication & 'Keep Me Signed In' with HttpOnly Cookies

This document explains every single component, file, and line of code implemented for the **"Keep Me Signed In" (Remember Me)** feature using **HttpOnly Cookies** across **Meal-App-Core** (Backend) and **Meal-Selection** (Frontend).

---

## High-Level Architecture & Lifecycle

```
========================================================================================================
                                     HTTPONLY COOKIE AUTH LIFECYCLE
========================================================================================================

 1. USER LOGIN / SIGNUP:
    ┌─────────────────────────┐
    │  User inputs Email, Pwd │
    │  [X] Keep me signed in  │
    └───────────┬─────────────┘
                │
                │  POST /auth/login { email, password, keepSignedIn: true/false }
                ▼
    ┌────────────────────────────────────────────────────────────────────────────────────────┐
    │  BACKEND (Meal-App-Core):                                                              │
    │  1. Verifies credentials.                                                              │
    │  2. Calculates Token & DB Expiry:                                                      │
    │     - If keepSignedIn === true: 7-day persistent cookie (Max-Age=604800000)            │
    │     - If keepSignedIn === false: Session cookie (NO Max-Age/Expires -> browser clears) │
    │  3. Sets Header: Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=...      │
    │  4. Returns JSON: { accessToken, user, availability }                                  │
    └────────────────────────────────────────────────────────────────────────────────────────┘
                │
                │  Response + Set-Cookie
                ▼
    ┌────────────────────────────────────────────────────────────────────────────────────────┐
    │  FRONTEND (Meal-Selection):                                                            │
    │  1. Browser automatically stores refreshToken in secure, unscriptable cookie jar.      │
    │  2. AuthContext stores accessToken in memory (and user profile).                       │
    │  3. User navigated to authenticated dashboard (/activities).                           │
    └────────────────────────────────────────────────────────────────────────────────────────┘

 2. SUBSEQUENT API CALLS:
    - Frontend Axios sends requests with `withCredentials: true` and `Authorization: Bearer <accessToken>`.

 3. ACCESS TOKEN EXPIRATION (401 Interceptor):
    - Axios catches 401.
    - Sends `POST /auth/refresh` (cookies sent automatically by browser).
    - Backend reads `req.cookies.refreshToken`, validates DB & JWT, returns new `accessToken`.
    - Axios updates in-memory token and retries failed request seamlessly.

 4. PAGE RELOAD / BROWSER REOPEN:
    - Frontend React mounts with `isInitializing: true` (displays clean LoadingSpinner).
    - AuthContext fires silent `authService.refresh()`.
    - If persistent cookie exists: backend verifies it, returns fresh `accessToken` & user profile.
    - If session cookie was closed or expired: backend returns 401, frontend redirects to `/login`.
    - `isInitializing` set to `false`.

 5. LOGOUT:
    - User clicks logout.
    - Frontend calls `POST /auth/logout`.
    - Backend deletes refreshToken record in DB and clears cookie via `res.clearCookie('refreshToken')`.
========================================================================================================
```

---

# SECTION 1: Backend Implementation (`Meal-App-Core`)

---

### 1. `Meal-App-Core/src/utility/cookieHelper.ts`
*Purpose: Provides centralized, environment-aware cookie configuration for Express.*

```typescript
import { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";
```
- **`isProduction`**: Detects if the backend is running in production (`NODE_ENV === "production"`).

```typescript
export const getRefreshTokenCookieOptions = (keepSignedIn: boolean = false): CookieOptions => {
  const sameSiteConfig = (process.env.COOKIE_SAME_SITE as "lax" | "strict" | "none") || (isProduction ? "none" : "lax");
  const secureConfig = process.env.COOKIE_SECURE !== undefined 
    ? process.env.COOKIE_SECURE === "true" 
    : isProduction;

  const options: CookieOptions = {
    httpOnly: true,
    secure: secureConfig,
    sameSite: sameSiteConfig,
    path: "/",
  };
```
- **`httpOnly: true`**: **Critical security setting.** Tells the browser that JavaScript code (`document.cookie`) cannot read or access this cookie. This completely eliminates XSS token theft.
- **`secure: secureConfig`**: When `true`, cookie is only transmitted over encrypted HTTPS connections. Defaults to `true` in production and `false` for local `http://localhost` development.
- **`sameSite: sameSiteConfig`**:
  - In local development (`http://localhost:5173` -> `http://localhost:5000`), `'lax'` allows cookies between standard localhost ports.
  - In production cross-site hosting (`https://meal-selection.vercel.app` -> `https://meal-app-core.vercel.app`), `'none'` is required by browsers to allow cross-site cookie transmission over HTTPS.
- **`path: "/"`**: Makes the cookie available for all backend endpoints (including `/auth/refresh` and `/auth/logout`).

```typescript
  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  if (keepSignedIn) {
    // 7 days in milliseconds
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    options.maxAge = maxAgeMs;
  }

  return options;
};
```
- **`options.domain`**: Allows binding to a root domain (e.g., `.seneca.com`) if frontend and backend share subdomains.
- **`if (keepSignedIn)`**:
  - **When `keepSignedIn === true`**: Sets `options.maxAge = 7 * 24 * 60 * 60 * 1000` (7 days). The browser marks the cookie as **Persistent**, saving it to disk across browser reboots.
  - **When `keepSignedIn === false`**: `maxAge` is **omitted**. The browser marks the cookie as a **Session Cookie**. When the user closes the browser application, the cookie is instantly deleted.

```typescript
export const getClearRefreshTokenCookieOptions = (): CookieOptions => {
  const sameSiteConfig = (process.env.COOKIE_SAME_SITE as "lax" | "strict" | "none") || (isProduction ? "none" : "lax");
  const secureConfig = process.env.COOKIE_SECURE !== undefined 
    ? process.env.COOKIE_SECURE === "true" 
    : isProduction;

  const options: CookieOptions = {
    httpOnly: true,
    secure: secureConfig,
    sameSite: sameSiteConfig,
    path: "/",
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};
```
- **`getClearRefreshTokenCookieOptions`**: Matches the exact path, domain, secure, and sameSite properties required by the browser to successfully delete the cookie upon logout.

---

### 2. `Meal-App-Core/src/app.ts`
*Purpose: Registers cookie parsing middleware and enables credentials across origins.*

```typescript
import cookieParser from "cookie-parser";
```
- Imports the middleware that parses incoming HTTP `Cookie:` headers and populates `req.cookies`.

```typescript
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "https://meal-selection.vercel.app",
  "https://meal-app-core.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || defaultAllowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);
```
- **`credentials: true`**: Tells Express to respond with `Access-Control-Allow-Credentials: true`. Browsers **strictly refuse** to send or store cookies for cross-origin requests if this header is missing.
- **`origin` callback**: When `credentials: true` is enabled, CORS forbids wildcard `*` origins. This callback dynamically checks incoming requests against approved frontend domains.

```typescript
app.use(cookieParser());
app.use(express.json());
```
- **`cookieParser()`**: Must run before route handlers so that `req.cookies.refreshToken` is available inside `authController`.

---

### 3. `Meal-App-Core/src/schema/auth.ts`
*Purpose: Validates request payloads with Zod.*

```typescript
export const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    keepSignedIn: z.boolean().optional().default(false)
});
```
- **`keepSignedIn: z.boolean().optional().default(false)`**: Accepts the user's "Keep me signed in" checkbox state from the frontend. Defaults to `false` if not provided.

```typescript
export const LogoutRequestSchema = z.object({
    refreshToken: z.string().min(1).optional()
});

export const RefreshRequestSchema = z.object({
    refreshToken: z.string().min(1).optional()
});
```
- **`refreshToken: ...optional()`**: Previously required in the request body. Now optional because the refresh token can be sent securely via the HttpOnly cookie.

---

### 4. `Meal-App-Core/src/services/authService.ts`
*Purpose: Handles business logic, token creation, and database persistence.*

```typescript
    login: async (loginRequest: LoginRequest) => {
        ...
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken =  generateRefreshToken(user.id)
        
        const refreshExpiryMs = loginRequest.keepSignedIn
            ? 7 * 24 * 60 * 60 * 1000 // 7 days
            : 24 * 60 * 60 * 1000;    // 1 day / 24 hours

        await prisma.refreshToken.create({
            data: 
            {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(
                Date.now() + refreshExpiryMs
            ),
            },
        });
```
- **`refreshExpiryMs`**:
  - If `keepSignedIn` is `true`: Database record expires in 7 days.
  - If `keepSignedIn` is `false`: Database record expires in 24 hours.
- Syncs database-level token invalidation with the browser cookie lifecycle.

```typescript
    getMe: async (userId: number) => {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: { role: { select: { id: true, name: true } } }
        });

        if (!user || !user.isActivated || user.status !== "ACTIVE") {
            throw new Error("User not found or inactive");
        }

        const availability = await prisma.userAvailability.findFirst({ where: { userId: user.id } });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                roleId: user.roleId,
                roleName: user.role.name,
            },
            availability: {
                startDate: availability?.startDate,
                endDate: availability?.endDate
            }
        };
    },
```
- **`getMe`**: Retrieves user profile and availability for the authenticated session, allowing instant profile population upon app startup.

```typescript
    refreshToken: async(refreshToken: string)=>{
        ...
        const availability = await prisma.userAvailability.findFirst({where: {userId: existing.user.id}});

        return {
            accessToken: newAccessToken,
            user: {
                id: existing.user.id,
                email: existing.user.email,
                name: existing.user.name,
                roleId: existing.user.roleId,
                roleName: existing.user.role.name,
            },
            availability: {
                startDate: availability?.startDate,
                endDate: availability?.endDate
            }
        }
    },
```
- **`refreshToken`**: In addition to the new access token, returns the user profile and availability so that the frontend can restore context on silent refresh without making additional network calls.

---

### 5. `Meal-App-Core/src/controllers/authController.ts`
*Purpose: Coordinates HTTP request/response, cookies, and status codes.*

```typescript
import { getClearRefreshTokenCookieOptions, getRefreshTokenCookieOptions } from "../utility/cookieHelper";

export const authController = {
    loginController : async (req : Request, res : Response) => {
        try{
            const request = LoginRequestSchema.safeParse(req.body);
            if(!request.success){
                return res.status(400).json({
                    message: `Invalid login data`,
                    errors: request.error.flatten()
                });
            }
            const authResult = await authService.login(request.data);

            const cookieOptions = getRefreshTokenCookieOptions(request.data.keepSignedIn);
            res.cookie("refreshToken", authResult.refreshToken, cookieOptions);

            res.status(200).json(authResult);
        }
        catch(error){
            res.status(401).json({message: "Invalid credentials"});
        }
    },
```
- **`res.cookie("refreshToken", authResult.refreshToken, cookieOptions)`**: Sends the HTTP `Set-Cookie` header to the browser with the refresh token and calculated expiration flags.

```typescript
    logOutController: async (req: Request, res: Response) => {
        try{
            const parsed = LogoutRequestSchema.safeParse(req.body);
            const tokenToRevoke = parsed.success && parsed.data?.refreshToken 
                ? parsed.data.refreshToken 
                : req.cookies?.refreshToken;

            if(tokenToRevoke){
                await authService.logout(tokenToRevoke);
            }

            res.clearCookie("refreshToken", getClearRefreshTokenCookieOptions());
            return res.status(200).json({message: "Logged out successfully"});

        }catch(error){
            res.status(400).json({
                message: "Failed to Logout"
            })
        }
    },
```
- **`tokenToRevoke`**: Checks `req.body.refreshToken` (for backward compatibility) and `req.cookies?.refreshToken` (from HttpOnly cookie).
- **`res.clearCookie(...)`**: Sends a response instructing the browser to delete the cookie immediately.

```typescript
    refreshController: async (req: Request, res: Response)=>{
        try{
            const parsed = RefreshRequestSchema.safeParse(req.body);
            const refreshToken = parsed.success && parsed.data?.refreshToken 
                ? parsed.data.refreshToken 
                : req.cookies?.refreshToken;

            if(!refreshToken){
                return res.status(401).json({message: "Refresh token is required"})
            }
            const refreshResult = await authService.refreshToken(refreshToken);
            return res.status(200).json(refreshResult)

        }catch(error){
            res.status(401).json({
                message: error instanceof Error ? error.message : "Failed to renew access token"
            })
        }
    },
```
- **`refreshController`**: Seamlessly extracts the refresh token from `req.cookies.refreshToken`.

```typescript
    getMeController: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const me = await authService.getMe(userId);
            return res.status(200).json(me);
        } catch (error) {
            return res.status(401).json({
                message: error instanceof Error ? error.message : "Failed to fetch user session"
            });
        }
    },
```
- **`getMeController`**: Returns current user info when protected by `authenticate` middleware.

---

### 6. `Meal-App-Core/src/routes/authRoutes.ts` & `src/middleware/authMiddleware.ts`

```typescript
router.get("/me", authenticate, authController.getMeController);
```
- Exposes `GET /auth/me` protected by `authenticate`.

```typescript
    if (authHeader) {
      const [type, headerToken] = authHeader.split(" ");
      if (type === "Bearer" && headerToken) {
        token = headerToken;
      }
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
```
- Enables `authenticate` middleware to check both `Authorization: Bearer` and `req.cookies.accessToken`.

---

# SECTION 2: Frontend Implementation (`Meal-Selection`)

---

### 1. `Meal-Selection/src/api/axios.ts`
*Purpose: Configures HTTP client with credentials and interceptors for automatic token refresh.*

```typescript
const apiClient = axios.create({
  baseURL: `${MEAL_APP_CORE}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
```
- **`withCredentials: true`**: **Essential Axios configuration.** Instructs the browser to automatically include cookies (`Cookie: refreshToken=...`) on all cross-origin requests to the backend.

```typescript
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getToken();

    const existingAuthHeader =
      (config.headers as Record<string, unknown> | undefined)?.[
        'Authorization'
      ] ??
      (config.headers as Record<string, unknown> | undefined)?.[
        'authorization'
      ];

    if (token && !existingAuthHeader) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);
```
- Injects the short-lived access token into the `Authorization: Bearer <token>` header for all outgoing API requests.

```typescript
      try {
        const response = await authService.refresh(
          refreshToken ? { refreshToken } : undefined,
        );

        const {
          accessToken,
          refreshToken: newRefreshToken,
        } = response;

        authStorage.setTokens(
          accessToken,
          newRefreshToken || refreshToken || '',
          isPersistent,
        );

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] =
            `Bearer ${accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (err) {
        authStorage.clear();
        processQueue(err, null);

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
```
- **401 Interceptor**: When an access token expires:
  1. Calls `authService.refresh()` without needing a token in JS storage (the browser sends the HttpOnly cookie automatically).
  2. Updates in-memory access token.
  3. Processes queued requests that were waiting on the refresh.
  4. Retries original failed request seamlessly without user interruption.

---

### 2. `Meal-Selection/src/api/Services/AuthServices.ts`
*Purpose: Type-safe API client service methods.*

```typescript
export interface LoginRequest {
  email: string;
  password: string;
  keepSignedIn?: boolean;
}
```
- Adds `keepSignedIn?: boolean` to the login request payload type.

```typescript
  logout: async (logoutRequest?: LogoutRequest): Promise<LogoutResponse> => {
    const response = await apiClient.post<LogoutResponse>("/auth/logout", logoutRequest || {});
    return response.data;
  },

  refresh: async (refreshRequest?: RefreshRequest): Promise<RefreshResponse> => {
    const response = await apiClient.post<RefreshResponse>("/auth/refresh", refreshRequest || {});
    return response.data;
  },

  getMe: async (): Promise<MeResponse> => {
    const response = await apiClient.get<MeResponse>("/auth/me");
    return response.data;
  },
```
- `logout()` and `refresh()` can now be invoked with `undefined` because parameters are supplied via HttpOnly cookies.

---

### 3. `Meal-Selection/src/pages/Auth/LoginHandler/LoginHandler.tsx`
*Purpose: Handles login submission flow.*

```typescript
export const useLoginHandler = () => {
    const { login } = useAuth();
    const loginMutation = useLoginMutation();

    const handleLogin = async (email: string, password: string, isPersistent: boolean = true) => {
            const response = await loginMutation.mutateAsync({ email, password, keepSignedIn: isPersistent });
            const { accessToken, refreshToken, user, availability } = response;
            login({user, availability }, accessToken, refreshToken, isPersistent);
            return response;
    }
    return handleLogin;
}
```
- **`keepSignedIn: isPersistent`**: Passes the checkbox value directly to `loginMutation`, ensuring the backend receives the user's preference.

---

### 4. `Meal-Selection/src/utils/interfaces/IAuthContextType.ts` & `AuthContext.tsx`
*Purpose: React Context providing authentication state and silent session bootstrapping.*

```typescript
export interface IAuthContextType {
  profile: IAuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isInitializing: boolean;
  login: (profile: IAuthUser, token: string, refreshToken?: string, isPersistent?: boolean) => void;
  logout: () => void;
}
```
- Adds `isInitializing: boolean` so protected routes know whether initial cookie verification is still pending.

```typescript
export const AuthProvider = ({children}:{children: ReactNode}) => {
    const [initialSession] = useState(loadInitialSession);
    const [token, setToken] = useState<string | null>(initialSession.token);
    const [refreshToken, setRefreshToken] = useState<string | null>(initialSession.refreshToken);
    const [profile, setProfile] = useState<IAuthUser | null>(initialSession.profile);
    const [isInitializing, setIsInitializing] = useState<boolean>(true);
```
- `isInitializing` starts as `true`.

```typescript
    useEffect(() => {
        let isMounted = true;

        const restoreSession = async () => {
            try {
                // Attempt to silently refresh session using HttpOnly cookie
                const response = await authService.refresh();
                if (isMounted && response?.accessToken) {
                    setToken(response.accessToken);
                    if (response.user) {
                        const restoredProfile: IAuthUser = {
                            user: response.user,
                            availability: response.availability ?? { startDate: '', endDate: '' }
                        };
                        setProfile(restoredProfile);
                        authStorage.setSession(restoredProfile, response.accessToken, response.refreshToken ?? '');
                    }
                }
            } catch (err) {
                // If silent refresh failed and there's no valid local session, clear storage
                if (isMounted && !token) {
                    setProfile(null);
                    setToken(null);
                    setRefreshToken(null);
                    authStorage.clear();
                }
            } finally {
                if (isMounted) {
                    setIsInitializing(false);
                }
            }
        };

        restoreSession();

        return () => {
            isMounted = false;
        };
    }, []);
```
- **Silent Session Restoration**:
  1. When the app loads (or page reloads), fires `authService.refresh()`.
  2. The browser automatically attaches the `refreshToken` cookie.
  3. If valid, restores `token` and `profile` in React state.
  4. Always sets `isInitializing = false` when complete.

---

### 5. `Meal-Selection/src/pages/Auth/ProtectedRoutes/ProtectedRoute.tsx` & `AdminProtectedRoute.tsx`
*Purpose: Route guarding with smooth loading transitions.*

```typescript
export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <LoadingSpinner subtext="Verifying session..." />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
```
- **`if (isInitializing)`**: Displays a clean `LoadingSpinner` while the initial cookie check takes place. This prevents the login screen or 401 redirects from flickering before the cookie can be verified.
- **`if (!token)`**: Only redirects to `/login` after verification is complete and no valid session exists.

---

### 6. `Meal-Selection/src/pages/Account/components/LogoutConfirmModal.tsx`
*Purpose: User-triggered logout modal.*

```typescript
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout(refreshToken ? { refreshToken } : undefined);
    } catch (e) {
      console.error('Logout error on server:', e);
    } finally {
      logout();
      setIsLoggingOut(false);
      onClose();
      navigate('/login');
    }
  };
```
- Invokes `authService.logout()`, triggering backend cookie deletion and DB token revocation, then clears React state and navigates to `/login`.

---

## Summary of Benefits

1. **Immunity to XSS Token Theft**: JavaScript cannot access `document.cookie` for the refresh token.
2. **True Persistent vs Session Logic**:
   - **Checked**: Browser retains cookie across reboots (7-day persistent).
   - **Unchecked**: Browser automatically purges cookie on window/app exit (session).
3. **Silent Session Bootstrap**: App loads and authenticates automatically without storing sensitive refresh tokens in `localStorage`.
4. **Seamless 401 Recovery**: Access token expires every 2 hours without logging the user out; silent refresh handles renewal in the background.
