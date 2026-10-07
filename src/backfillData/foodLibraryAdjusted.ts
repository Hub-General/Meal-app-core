import type { FoodGroup } from "../generated/prisma";

export interface FoodLibraryItem {
  id: number;
  name: string;
  foodCode: string;
  foodGroup: FoodGroup;
  createdAt: string;
  updatedAt: string;
}

export const foodLibraryAdjusted: FoodLibraryItem[] = [
  {
    "id": 1,
    "name": "Rice",
    "foodCode": "R",
    "foodGroup": "SUPERGROUP",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 2,
    "name": "Swallow",
    "foodCode": "S",
    "foodGroup": "SUPERGROUP",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 3,
    "name": "Tuber",
    "foodCode": "T",
    "foodGroup": "SUPERGROUP",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 4,
    "name": "Continental",
    "foodCode": "X",
    "foodGroup": "SUPERGROUP",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 5,
    "name": "Noodles",
    "foodCode": "N",
    "foodGroup": "SUPERGROUP",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 6,
    "name": "Beans-Based",
    "foodCode": "B",
    "foodGroup": "SUPERGROUP",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 7,
    "name": "Jollof",
    "foodCode": "JO",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 8,
    "name": "Check-Check",
    "foodCode": "CK",
    "foodGroup": "VARIATION",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 9,
    "name": "Assorted",
    "foodCode": "AS",
    "foodGroup": "VARIATION",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 10,
    "name": "Fried Rice",
    "foodCode": "FR",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 11,
    "name": "Fried Rice Check-Check",
    "foodCode": "FC",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 12,
    "name": "Assorted Fried Rice",
    "foodCode": "FA",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 13,
    "name": "Plain Rice",
    "foodCode": "PR",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 14,
    "name": "Angwamo",
    "foodCode": "AN",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 15,
    "name": "Vermicelli",
    "foodCode": "VE",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 16,
    "name": "Fufu",
    "foodCode": "FU",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 17,
    "name": "Banku",
    "foodCode": "BK",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 18,
    "name": "Kenkey",
    "foodCode": "KK",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 19,
    "name": "Konkonte",
    "foodCode": "KO",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 20,
    "name": "Eba",
    "foodCode": "EB",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 21,
    "name": "Omotuo",
    "foodCode": "OT",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 22,
    "name": "TZ",
    "foodCode": "TZ",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 23,
    "name": "Acheke",
    "foodCode": "AC",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 24,
    "name": "Yam",
    "foodCode": "YM",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 25,
    "name": "Yam Chops",
    "foodCode": "YQ",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 26,
    "name": "Yam Chips",
    "foodCode": "YC",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 27,
    "name": "Apem/Plantain",
    "foodCode": "AP",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 28,
    "name": "Chicken Wrap",
    "foodCode": "CW",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 29,
    "name": "Chicken Burger",
    "foodCode": "CB",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 30,
    "name": "Beef Burger",
    "foodCode": "BB",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 31,
    "name": "Noodles",
    "foodCode": "ND",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 32,
    "name": "Salad",
    "foodCode": "SL",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 33,
    "name": "No Protein",
    "foodCode": "OO",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 34,
    "name": "Chicken",
    "foodCode": "CH",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 35,
    "name": "Chicken Wings",
    "foodCode": "CW",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 36,
    "name": "Pork",
    "foodCode": "PK",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 37,
    "name": "Beef",
    "foodCode": "BF",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 38,
    "name": "Goat",
    "foodCode": "GT",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 39,
    "name": "Fish",
    "foodCode": "FS",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 40,
    "name": "Gizzard",
    "foodCode": "GZ",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 41,
    "name": "Cow Leg",
    "foodCode": "CL",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 42,
    "name": "Turkey",
    "foodCode": "TU",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 43,
    "name": "Egg",
    "foodCode": "EG",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 44,
    "name": "Sausage",
    "foodCode": "SS",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 45,
    "name": "Tuna",
    "foodCode": "TN",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 46,
    "name": "Sardine",
    "foodCode": "SD",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 47,
    "name": "Grilled",
    "foodCode": "G",
    "foodGroup": "PREP",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 48,
    "name": "Fried",
    "foodCode": "F",
    "foodGroup": "PREP",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-06-22 12:12:58.775"
  },
  {
    "id": 49,
    "name": "Stew",
    "foodCode": "ST",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 50,
    "name": "Light Soup",
    "foodCode": "LS",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 51,
    "name": "Groundnut Soup",
    "foodCode": "GS",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 52,
    "name": "Palava Sauce",
    "foodCode": "PS",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 53,
    "name": "Okro Soup",
    "foodCode": "OS",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 54,
    "name": "Vegetable Stew",
    "foodCode": "VS",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 55,
    "name": "Egg Stew",
    "foodCode": "ES",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 56,
    "name": "Garden Egg Stew",
    "foodCode": "GES",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 57,
    "name": "Fante Fante",
    "foodCode": "FF",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 58,
    "name": "Palmnut Soup",
    "foodCode": "PNS",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-06-22 12:12:58.775",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 59,
    "name": "Ayoyo Soup",
    "foodCode": "AY",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-08-28 02:14:58.054",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 60,
    "name": "Gravy",
    "foodCode": "GR",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-08-28 02:14:58.054",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 62,
    "name": "Creamy Vegetables",
    "foodCode": "CV",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-08-28 02:14:58.054",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 63,
    "name": "Zongo Rice",
    "foodCode": "ZR",
    "foodGroup": "BASE",
    "createdAt": "2026-08-28 02:14:58.054",
    "updatedAt": "2026-08-28 02:14:58.054"
  },
  {
    "id": 64,
    "name": "Efie Jollof",
    "foodCode": "EJ",
    "foodGroup": "BASE",
    "createdAt": "2026-08-28 02:14:58.054",
    "updatedAt": "2026-08-28 02:14:58.054"
  },
  {
    "id": 65,
    "name": "Vegetable Rice",
    "foodCode": "VR",
    "foodGroup": "BASE",
    "createdAt": "2026-08-28 02:14:58.054",
    "updatedAt": "2026-08-28 02:14:58.054"
  },
  {
    "id": 66,
    "name": "Tilapia",
    "foodCode": "TI",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-08-28 02:41:20.261",
    "updatedAt": "2026-08-28 02:41:20.261"
  },
  {
    "id": 67,
    "name": "Fries",
    "foodCode": "FRI",
    "foodGroup": "BASE",
    "createdAt": "2026-08-28 02:41:20.261",
    "updatedAt": "2026-08-28 02:41:20.261"
  },
  {
    "id": 68,
    "name": "Korkor",
    "foodCode": "KOK",
    "foodGroup": "BASE",
    "createdAt": "2026-08-28 02:41:20.261",
    "updatedAt": "2026-08-28 02:41:20.261"
  },
  {
    "id": 69,
    "name": "Grain-Based",
    "foodCode": "G",
    "foodGroup": "SUPERGROUP",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 70,
    "name": "Plantain",
    "foodCode": "P",
    "foodGroup": "SUPERGROUP",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 71,
    "name": "Other",
    "foodCode": "O",
    "foodGroup": "SUPERGROUP",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 72,
    "name": "Waakye",
    "foodCode": "WK",
    "foodGroup": "BASE",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 73,
    "name": "Red Red",
    "foodCode": "RR",
    "foodGroup": "BASE",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 74,
    "name": "Gobe",
    "foodCode": "GB",
    "foodGroup": "BASE",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 75,
    "name": "Garifotor",
    "foodCode": "GF",
    "foodGroup": "BASE",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 76,
    "name": "Kelewele",
    "foodCode": "KL",
    "foodGroup": "BASE",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 77,
    "name": "Veggie Jollof",
    "foodCode": "VJ",
    "foodGroup": "VARIATION",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 78,
    "name": "Beans Stew",
    "foodCode": "BS",
    "foodGroup": "ACCOMPANIMENT",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 79,
    "name": "Peppered",
    "foodCode": "PP",
    "foodGroup": "MODIFIER",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  },
  {
    "id": 80,
    "name": "Boiled",
    "foodCode": "BO",
    "foodGroup": "PREP",
    "createdAt": "2026-10-07 10:30:00.000",
    "updatedAt": "2026-10-07 10:30:00.000"
  }
];
