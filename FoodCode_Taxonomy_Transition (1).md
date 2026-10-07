# FoodLibrary & Meal FoodCode Taxonomy Transition

## Overview

The FoodCode system was redesigned to move from a relatively flat
collection of food groups and preparation labels into a structured
seven-dimensional representation of a meal.

The goal was not simply to rename codes. The goal was to make a FoodCode
describe the **semantic composition of a meal** in a predictable,
extensible way while preserving the existing database relationships and
meal assets.

The finalized meal FoodCode structure is:

``` text
SUPERGROUP-BASE-VARIATION-PROTEIN-ACCOMPANIMENT-MODIFIER-PREP
```

Every meal therefore has exactly **7 blocks**.

When a dimension does not apply, the backend can supply:

``` text
OO
```

`OO` does not need to exist as a FoodLibrary record for every FoodGroup.

Multiple values inside a single block are represented with:

``` text
|
```

For example:

``` text
EG|SS|BF|CH
```

represents Egg, Sausage, Beef and Chicken within the same dimension.

------------------------------------------------------------------------

# 1. Why the Taxonomy Was Changed

The original system mixed several different concepts together.

For example, preparation methods such as `Stew`, `Groundnut Soup`, and
`Fante Fante` were stored under `PREP`, even though they do not all
describe how the food itself was prepared.

Likewise, entries such as:

-   Jollof
-   Jollof Check-Check
-   Assorted Jollof
-   Fried Rice
-   Fried Rice Check-Check
-   Assorted Fried Rice

were represented as separate base foods even though some of those
distinctions are better understood as variations of a base.

This made the FoodCode increasingly difficult to reason about as the
meal library grew.

The transition therefore separates the major semantic dimensions of a
meal instead of encoding everything into a single flat list.

------------------------------------------------------------------------

# 2. Final Seven FoodCode Dimensions

## 2.1 SUPERGROUP

The Supergroup describes the broad food family or identity of the meal.

Final Supergroups:

  Name          Code
  ------------- ------
  Rice          `R`
  Beans-Based   `B`
  Swallow       `S`
  Grain-Based   `G`
  Plantain      `P`
  Tuber         `T`
  Noodles       `N`
  Continental   `X`
  Other         `O`

### Important decisions

### Beans-Based

The former concept of beans as a narrow category was broadened to
**Beans-Based**.

This allows foods such as:

-   Waakye
-   Red Red
-   Gobe

to belong to the same broad food family.

The supergroup is therefore about the meal's primary identity rather
than every individual ingredient.

### Grain-Based

A new `GRAIN-BASED` supergroup was introduced for foods such as:

-   Acheke
-   Garifotor

This prevents them from being incorrectly forced into the rice, tuber,
or swallow categories.

### Plantain

Plantain is explicitly separate from tubers.

Foods such as:

-   Kelewele
-   Korkor
-   Apem

belong to the Plantain family where appropriate.

### Cassava

Cassava was deliberately removed as a top-level Supergroup.

Different cassava-derived foods have different culinary identities:

-   Fufu → Swallow
-   Eba → Swallow
-   Acheke → Grain-Based

The raw ingredient does not necessarily determine the meal's Supergroup.

------------------------------------------------------------------------

# 3. BASE

`BASE` replaced the proposed `FOOD` terminology.

This distinction was important.

The term **BASE** better communicates that this dimension represents the
primary food foundation of the meal.

Examples include:

``` text
JO  = Jollof
FR  = Fried Rice
PR  = Plain Rice
FU  = Fufu
BK  = Banku
KK  = Kenkey
KO  = Konkonte
EB  = Eba
OT  = Omotuo
AC  = Acheke
YM  = Yam
WK  = Waakye
RR  = Red Red
GB  = Gobe
GF  = Garifotor
KL  = Kelewele
```

This also allowed variations to be separated from the base itself.

For example, instead of:

``` text
Jollof Check-Check
```

being its own BASE, the model becomes:

``` text
BASE = Jollof
VARIATION = Check-Check
```

------------------------------------------------------------------------

# 4. VARIATION

Variation captures meaningful changes to a base dish that still leave it
recognizably part of the same base family.

Current variations:

  Name          Code
  ------------- ------
  Check-Check   `CK`
  Assorted      `AS`

Examples:

``` text
R-JO-CK-CH-OO-OO-F
```

means:

> Rice → Jollof → Check-Check → Chicken → no accompaniment → no modifier
> → Fried

Similarly:

``` text
R-JO-AS-CH-OO-OO-G
```

represents:

> Rice → Jollof → Assorted → Chicken → no accompaniment → no modifier →
> Grilled

`Assorted` was intentionally kept as a VARIATION rather than a MODIFIER
because, within this meal model, it meaningfully changes the
composition/identity of the dish rather than merely describing an
incidental characteristic.

------------------------------------------------------------------------

# 5. PROTEIN

Protein identifies the principal protein component.

Current values include:

  Name            Code
  --------------- ------
  No Protein      `OO`
  Chicken         `CH`
  Chicken Wings   `CW`
  Pork            `PK`
  Beef            `BF`
  Goat            `GT`
  Fish            `FS`
  Gizzard         `GZ`
  Cow Leg         `CL`
  Turkey          `TU`
  Egg             `EG`
  Sausage         `SS`
  Tuna            `TN`
  Sardine         `SD`
  Tilapia         `TI`

Multiple proteins can occupy the same block using `|`.

For example:

``` text
EG|SS|BF|CH
```

represents:

-   Egg
-   Sausage
-   Beef
-   Chicken

This is particularly useful for assorted meals.

------------------------------------------------------------------------

# 6. ACCOMPANIMENT

A major conceptual change was moving sauces and soups out of `PREP`.

The following are now `ACCOMPANIMENT` values:

  Name                Code
  ------------------- -------
  Stew                `ST`
  Light Soup          `LS`
  Groundnut Soup      `GS`
  Palava Sauce        `PS`
  Okro Soup           `OS`
  Vegetable Stew      `VS`
  Egg Stew            `ES`
  Garden Egg Stew     `GES`
  Fante Fante         `FF`
  Palmnut Soup        `PNS`
  Ayoyo Soup          `AY`
  Gravy               `GR`
  Creamy Vegetables   `CV`

This is more semantically accurate because these are generally things
**served with the base**, rather than universal cooking methods.

For example:

``` text
S-FU-OO-GT-LS-OO-OO
```

means:

> Swallow → Fufu → standard variation → Goat → Light Soup → no modifier
> → no preparation encoded

The structure now makes the relationship between fufu, goat and light
soup explicit.

------------------------------------------------------------------------

# 7. MODIFIER

Modifiers describe an additional characteristic of the meal that is
neither the base, variation, protein, accompaniment, nor preparation
method.

The current modifier is:

  Name       Code
  ---------- ------
  Peppered   `PP`

For example, a peppered gizzard meal can distinguish the gizzard itself
from the fact that it is peppered.

The taxonomy intentionally does **not** contain a large speculative
modifier list.

New modifiers should be added when actual meal data demonstrates a
meaningful recurring need for them.

------------------------------------------------------------------------

# 8. PREP

Preparation is now reserved for actual preparation/cooking methods.

Current values:

  Name      Code
  --------- ------
  Grilled   `G`
  Fried     `F`

Potential future values can include things such as:

-   Boiled
-   Roasted
-   Smoked

but these should only be added when the meal library actually requires
them.

This avoids prematurely bloating the taxonomy.

------------------------------------------------------------------------

# 9. Seven-Block Invariant

One of the most important changes is that a FoodCode now always has
exactly seven blocks.

For example:

``` text
R-JO-AS-CH-OO-OO-G
```

contains:

1.  `R` → SUPERGROUP
2.  `JO` → BASE
3.  `AS` → VARIATION
4.  `CH` → PROTEIN
5.  `OO` → ACCOMPANIMENT
6.  `OO` → MODIFIER
7.  `G` → PREP

A meal without a variation, accompaniment or modifier does not lose
those positions.

Instead:

``` text
OO
```

occupies the empty dimension.

This makes parsing deterministic.

------------------------------------------------------------------------

# 10. Why `OO` Is Important

The system deliberately avoids variable-length FoodCodes.

Without placeholders, these two codes could become difficult to
distinguish:

``` text
R-JO-CH-F
R-JO-ST-CH-F
```

It is not immediately obvious which block represents which semantic
dimension.

With the seven-block structure:

``` text
R-JO-OO-CH-OO-OO-F
```

and:

``` text
R-JO-OO-CH-ST-OO-F
```

the meaning of every position is fixed.

The backend can inject `OO` automatically when a dimension is absent, so
the FoodLibrary does not need an `OO` record for every category.

The existing `No Protein` record can remain useful because it represents
an explicit protein choice in the UI/data model.

------------------------------------------------------------------------

# 11. Meal Migration

The meal records were subsequently migrated to the new structure.

The migration preserved:

-   `id`
-   `imagePath`
-   existing calorie values
-   meal names
-   existing meal records

The objective was to change the FoodCode representation rather than
recreate the meals.

This is important because the meal primary keys and image assets are
independent of the FoodCode taxonomy.

The resulting meal dataset contains **132 meal records**.

------------------------------------------------------------------------

# 12. Collision Handling

FoodCode collisions were treated as a data-quality issue rather than
silently overwriting one meal with another.

A collision occurred around the burger meals.

The relevant meals were:

-   Chicken Burger with Fries
-   Chicken Burger with Fries and Chicken
-   Chicken Burger with Fries and Chicken Wings

The base `Chicken Burger` already communicates the burger's primary
identity, so the additional protein should only be encoded when it
represents an additional component.

The resulting distinction is:

``` text
X-CB|FRI-OO-OO-OO-OO
```

for the basic Chicken Burger + Fries meal, versus:

``` text
X-CB|FRI-OO-CH-OO-OO
```

for Chicken Burger + Fries + additional Chicken, and:

``` text
X-CB|FRI-OO-CW-OO-OO
```

for Chicken Burger + Fries + additional Chicken Wings.

This preserves uniqueness without inventing unnecessary FoodLibrary
concepts.

### General collision rule

If two meals produce the same FoodCode, the solution should **not** be
to arbitrarily append a random identifier.

Instead, we should ask:

> What meaningful semantic difference exists between the meals?

That difference should be represented in the appropriate FoodCode
dimension.

------------------------------------------------------------------------

# 13. Preparation Gap Identified

During the meal migration, one additional taxonomy requirement became
visible.

The meal:

``` text
Efie Jollof with Boiled Eggs
```

contains a preparation distinction that cannot currently be represented
because the PREP library only contains:

``` text
G = Grilled
F = Fried
```

The current representation therefore leaves the preparation block as
`OO`.

A natural future addition is:

``` text
Boiled → BO → PREP
```

which would allow the meal to become:

``` text
R-EJ-OO-EG-OO-OO-BO
```

This is a good example of why the migration is useful: it exposes
genuine taxonomy gaps without requiring us to prematurely create dozens
of new categories.

------------------------------------------------------------------------

# 14. Primary Key Strategy

The migration does **not** replace FoodLibrary or meal primary keys.

Existing records are updated in place.

For example, a record can change from:

``` text
Jollof Check-Check
```

to:

``` text
Check-Check
```

and change its `foodGroup` from `BASE` to `VARIATION`, while retaining
the exact same database `id`.

This means existing foreign-key relationships remain intact.

The same principle applies to meals:

``` text
meal.id
meal.imagePath
```

remain unchanged while `meal.foodCode` is normalized.

------------------------------------------------------------------------

# 15. Why This Model Is Better

The main improvement is that the FoodCode now represents **composition
and semantics rather than naming conventions**.

Instead of treating:

``` text
Jollof
Jollof Check-Check
Assorted Jollof
```

as unrelated foods, the model can express:

``` text
Jollof + Check-Check
Jollof + Assorted
```

Likewise, a meal can independently express:

``` text
Base
+
Variation
+
Protein
+
Accompaniment
+
Modifier
+
Preparation
```

This makes the system easier to:

-   search
-   filter
-   group
-   validate
-   generate meal combinations
-   build menus
-   detect duplicates
-   extend with new food concepts
-   reason about meals programmatically

------------------------------------------------------------------------

# 16. Backend Implications

The backend should treat FoodCode as a structured identifier rather than
a string that is manually assembled everywhere.

Conceptually:

``` ts
type FoodCodeParts = {
  supergroup: string;
  base: string;
  variation: string;
  protein: string;
  accompaniment: string;
  modifier: string;
  prep: string;
};
```

The final code should then be constructed in a deterministic order:

``` text
SUPERGROUP
BASE
VARIATION
PROTEIN
ACCOMPANIMENT
MODIFIER
PREP
```

Missing values become `OO`.

This also provides a natural validation rule:

``` text
foodCode.split("-").length === 7
```

with additional validation for each block.

------------------------------------------------------------------------

# 17. Data Integrity Rules Going Forward

The following rules should be treated as part of the FoodCode contract.

### Rule 1 --- Exactly seven blocks

Every meal FoodCode must have seven hyphen-separated dimensions.

### Rule 2 --- `OO` represents absence

Do not shift later dimensions left when a dimension is missing.

### Rule 3 --- Pipes represent multiple values

Multiple proteins or other same-dimension components use:

``` text
A|B|C
```

rather than creating a new FoodLibrary category for every combination.

### Rule 4 --- Base and variation remain separate

Do not create a new BASE merely because a dish has a common variation.

### Rule 5 --- Preparation is preparation

Soups, sauces and accompaniments should not be placed in PREP merely
because they were historically classified that way.

### Rule 6 --- Do not invent taxonomy unnecessarily

New codes should be introduced when real meal data requires a semantic
distinction.

### Rule 7 --- FoodCodes must remain unique for meals

If two meals collide, investigate the semantic difference rather than
appending arbitrary identifiers.

### Rule 8 --- Preserve database identity

FoodCode changes should not require replacing meal or FoodLibrary
primary keys.

------------------------------------------------------------------------

# 18. Introspection

The biggest change is not the individual codes. It is the shift in how
the system thinks about food.

The original approach was closer to:

> "What name do we give this meal?"

The new approach is:

> "What is this meal made of, and how is it prepared?"

That distinction matters because names are often inconsistent, while the
underlying structure is more stable.

For example, `Jollof Check-Check` is a name, but the system benefits
more from understanding:

``` text
Rice
→ Jollof
→ Check-Check
→ Protein
→ Accompaniment
→ Modifier
→ Preparation
```

The same reasoning works across very different meals.

This also makes the taxonomy more resilient. A new meal does not
necessarily require a new FoodLibrary record. If the existing semantic
components can describe it, the meal can be represented through their
combination.

The migration therefore moves the FoodCode system from a **catalog of
dish names** toward a **compositional food ontology**.

------------------------------------------------------------------------

# 19. Current State

The transition has established:

``` text
SUPERGROUP
    ↓
BASE
    ↓
VARIATION
    ↓
PROTEIN
    ↓
ACCOMPANIMENT
    ↓
MODIFIER
    ↓
PREP
```

with:

``` text
OO = not applicable / absent
|  = multiple values in the same dimension
-  = dimension separator
```

The FoodLibrary records are updated in place, preserving their primary
keys.

The meal records are normalized to the same structure while preserving
their IDs, image paths and calorie values.

The migration also surfaced the remaining need to consider `BO = Boiled`
as a PREP value for meals such as Efie Jollof with Boiled Eggs.

Overall, the transition establishes a cleaner foundation for future meal
creation, validation, search, filtering and menu generation without
requiring the database to continually grow new records for every
possible combination of ingredients.
