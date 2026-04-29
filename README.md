# Jídlo Lépe – Backend & Frontend

> Bakalářský projekt: Mobilní aplikace pro alergiky umožňující skenování čárových kódů produktů a porovnání složení s alergenem přihlášeného uživatele. Backend v Spring Boot, mobilní frontend v React Native (Expo).

---

## Obsah

1. [Cíl projektu](#1-cíl-projektu)
2. [Architektura systému](#2-architektura-systému)
3. [Backend – Spring Boot](#3-backend--spring-boot)
4. [Frontend – React Native (Expo)](#4-frontend--react-native-expo)
5. [Bezpečnostní mechanismy](#5-bezpečnostní-mechanismy)
6. [REST API reference](#6-rest-api-reference)
7. [Spuštění projektu](#7-spuštění-projektu)
8. [Struktura projektu](#8-struktura-projektu)
9. [Kontakt](#9-kontakt)

---

## 1. Cíl projektu

Cílem práce je navrhnout a implementovat systém „Jídlo Lépe", který:

- umožňuje uživatelům spravovat svůj seznam alergenů
- po naskenování čárového kódu produktu porovná složení s alergenem uživatele
- využívá JWT autentizaci pro zabezpečení přístupu
- komunikuje s externím API OpenFoodFacts pro data o produktech
- je ovladatelný jako mobilní aplikace (Android/iOS) přes Expo Go

---

## 2. Architektura systému

```
┌─────────────────────────┐        REST API        ┌──────────────────────────────┐
│   React Native (Expo)   │ ◄────────────────────► │   Spring Boot backend        │
│   mobilní frontend      │   JWT v hlavičce        │   port 8082                  │
└─────────────────────────┘                         └──────────┬───────────────────┘
                                                               │
                                                    ┌──────────▼───────────────────┐
                                                    │   PostgreSQL databáze         │
                                                    │   db: jidlolepe              │
                                                    └──────────────────────────────┘

Produktová data: OpenFoodFacts API (https://world.openfoodfacts.org)
```

Frontend i backend jsou oddělené projekty propojené přes HTTP REST API. Mobilní aplikace ukládá JWT token do `AsyncStorage` a přikládá jej ke každému autentizovanému požadavku v hlavičce `Authorization: Bearer <token>`.

---

## 3. Backend – Spring Boot

### 3.1 Technologický stack

| Technologie | Verze |
|---|---|
| Java | 17+ |
| Spring Boot | 3.2.5 |
| Spring Security | (součást Boot) |
| Spring Data JPA / Hibernate | (součást Boot) |
| PostgreSQL JDBC driver | (součást Boot) |
| JJWT | 0.11.5 |
| Springdoc OpenAPI (Swagger) | 2.1.0 |
| Lombok | (součást Boot) |

### 3.2 Datový model

**Entity:**

- `User` – uživatel s emailem, heslem (bcrypt), vazbou na role a alergeny
- `Allergen` – alergen s názvem, URL ikony a mapou překladů (`Map<String, String>`)
- `Role` – role uživatele (např. `ROLE_USER`, `ROLE_ADMIN`)

**Vztahy:**

- `User` ↔ `Allergen` – many-to-many, spojovací tabulka `user_allergens`
- `User` ↔ `Role` – many-to-many, spojovací tabulka `users_roles`
- `Allergen` → překlady – element collection v tabulce `allergen_translations`

### 3.3 DTO

| DTO | Účel |
|---|---|
| `LoginDTO` | Email a heslo pro přihlášení |
| `RegisterDTO` | Email a heslo pro registraci |
| `AuthResponse` | Odpověď s JWT tokenem po přihlášení |
| `UserDTO` | Email uživatele + množina ID alergenů (`Set<Long>`) |
| `UpdateUserAllergensDto` | Seznam ID alergenů poslaných frontendem |
| `AllergenDTO` | Alergen s id, name, iconUrl a překlady |

### 3.4 Controllery

| Controller | Endpoint prefix | Popis |
|---|---|---|
| `AuthController` | `/api/auth` | Přihlášení (vydání JWT) |
| `UserController` | `/api/users` | Správa alergenů přihlášeného uživatele |
| `AllergenController` | `/api/allergens` | Výpis všech dostupných alergenů |
| `ProductProxyController` | `/api/products` | Proxy na OpenFoodFacts API |

### 3.5 Services

- `AuthService` / `AuthServiceImpl` – ověření přihlašovacích údajů, generování JWT
- `UserService` – načtení a uložení alergenů uživatele
- `AllergenService` – výpis alergenů z databáze
- `UserDetailsServiceImpl` – integrace s Spring Security (načtení uživatele podle emailu)

### 3.6 Konfigurace databáze

Nastavení v `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/jidlolepe
spring.datasource.username=jidlolepeadmin
spring.datasource.password=admin
spring.datasource.driver-class-name=org.postgresql.Driver
server.port=8082
server.address=0.0.0.0
spring.jpa.hibernate.ddl-auto=update
```

---

## 4. Frontend – React Native (Expo)

### 4.1 Technologický stack

- React Native + Expo Router (file-based routing)
- TypeScript
- AsyncStorage (ukládání JWT tokenu)
- Context API (`authContext`) – správa stavu přihlášení
- Expo Camera (`CameraView`) – skenování čárových kódů
- NativeWind / Tailwind CSS – stylování
- Axios + `fetch` – HTTP komunikace

### 4.2 Obrazovky

| Soubor | Cesta | Popis |
|---|---|---|
| `app/(tabs)/index.tsx` | `/` | Hlavní obrazovka |
| `app/(tabs)/scan.tsx` | `/scan` | Skenování čárového kódu (EAN-13, EAN-8, QR, …) |
| `app/(tabs)/profile.tsx` | `/profile` | Přihlášení / profil uživatele, zobrazení alergenů |
| `app/(tabs)/fav.tsx` | `/fav` | Oblíbené produkty |
| `app/(tabs)/search.tsx` | `/search` | Vyhledávání produktů |
| `app/Product/[id].tsx` | `/Product/:id` | Detail produktu – složení + kontrola alergenů |
| `app/AuthScreen.tsx` | `/AuthScreen` | Přihlašovací obrazovka |

### 4.3 Konfigurace API

URL backendu je definována v `config/api.ts`:

```ts
export const API_BASE_URL = 'http://<IP_BACKENDU>:8082';
```

Při vývoji přes Expo Go je nutné nastavit IP adresu počítače v lokální síti (nikoliv `localhost`), protože fyzický mobilní telefon nemůže dosáhnout na `localhost` vývojářského stroje.

### 4.4 Autentizace ve frontendu

1. Uživatel zadá email a heslo na obrazovce `/profile` (nebo `AuthScreen`).
2. Frontend pošle `POST /api/auth/login` s `{ email, password }`.
3. Backend vrátí `{ token: "..." }` – JWT token se uloží do `AsyncStorage`.
4. Při každém chráněném požadavku se token přikládá: `Authorization: Bearer <token>`.
5. Alergeny uživatele se načítají z `GET /api/users/allergens` a ukládají do `AsyncStorage` pod klíčem `user_allergens`.

### 4.5 Skenování a kontrola alergenů

1. Obrazovka `/scan` aktivuje `CameraView` s podporou čárových kódů (EAN-13, EAN-8, UPC, Code128, QR).
2. Po naskenování přejde aplikace na `/Product/<id>`.
3. Detail produktu načte data přímo z `https://world.openfoodfacts.org/api/v0/product/<id>.json`.
4. Složení produktu se porovná s alergeny uloženými v `AsyncStorage` a výsledek je vizuálně zobrazen uživateli.

---

## 5. Bezpečnostní mechanismy

- **JWT autentizace** – po přihlášení je vydán podepsaný JWT token; expirační doba je nakonfigurována v `JwtUtil`
- **JwtRequestFilter** – Spring Security filter, který před každým požadavkem ověří platnost tokenu z hlavičky `Authorization: Bearer <token>`
- **Role-based access control** – entity `Role` (např. `ROLE_USER`, `ROLE_ADMIN`); endpointy jsou zabezpečeny dle role v `SecurityConfig`
- **BCrypt** – hesla uživatelů jsou hashována, nikdy se neukládají v čitelné podobě
- **CORS** – `@CrossOrigin("*")` na `AuthController` a `ProductProxyController` pro přístup z mobilní aplikace

---

## 6. REST API reference

### 6.1 Autentizace

#### Přihlášení

```http
POST /api/auth/login
Content-Type: application/json
```

Tělo požadavku:
```json
{
  "email": "jan@example.com",
  "password": "heslo123"
}
```

Odpověď `200 OK`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

Odpověď `401 Unauthorized` při neplatných přihlašovacích údajích:
```
Neplatný email nebo heslo
```

---

### 6.2 Alergeny uživatele

#### Načtení alergenů přihlášeného uživatele

```http
GET /api/users/allergens
Authorization: Bearer <token>
```

Odpověď `200 OK`:
```json
["Lepek", "Mléko", "Vejce"]
```

#### Uložení alergenů uživatele

```http
PUT /api/users/allergens
Authorization: Bearer <token>
Content-Type: application/json
```

Tělo požadavku (ID alergenů z číselníku):
```json
{
  "email": "jan@example.com",
  "allergenIds": [1, 3, 5]
}
```

Odpověď `200 OK` – vrátí aktualizovaný `UserDTO`.

---

### 6.3 Číselník alergenů

#### Výpis všech dostupných alergenů

```http
GET /api/allergens
Authorization: Bearer <token>
```

Odpověď `200 OK`:
```json
[
  {
    "id": 1,
    "name": "Lepek",
    "iconUrl": "https://example.com/icons/lepek.png",
    "translations": {
      "en": "Gluten",
      "de": "Gluten",
      "cz": "Lepek"
    }
  }
]
```

---

### 6.4 Produktová data (proxy na OpenFoodFacts)

Backend poskytuje proxy endpointy, které přeposílají požadavky na OpenFoodFacts API. Frontend v detailu produktu volá OpenFoodFacts přímo.

#### Detail produktu podle čárového kódu

```http
GET /api/products/{id}
```

Přeposílá na `https://world.openfoodfacts.org/api/v0/product/{id}.json`.

#### Výpis snacků (ukázka)

```http
GET /api/products/snacks
GET /api/products/
```

Odpověď `502 Bad Gateway` při nedostupnosti OpenFoodFacts:
```json
{"error": "OpenFoodFacts API nedostupné"}
```

---

### 6.5 Swagger UI

Po spuštění backendu je interaktivní dokumentace dostupná na:

```
http://localhost:8082/swagger-ui/index.html
```

---

## 7. Spuštění projektu

### 7.1 Backend

**Požadavky:**
- Java 17+
- Maven
- PostgreSQL (databáze `jidlolepe`, uživatel `jidlolepeadmin`)

**Vytvoření databáze (PostgreSQL):**
```sql
CREATE DATABASE jidlolepe;
CREATE USER jidlolepeadmin WITH PASSWORD 'admin';
GRANT ALL PRIVILEGES ON DATABASE jidlolepe TO jidlolepeadmin;
```

**Spuštění:**
```bash
cd JidloLepeBackend
./mvnw spring-boot:run
```

Backend naslouchá na portu `8082` (`0.0.0.0:8082`). Schéma databáze se vytvoří automaticky (`ddl-auto=update`).

---

### 7.2 Frontend

**Požadavky:**
- Node.js (LTS) + npm
- Expo Go aplikace na mobilním zařízení

**Instalace a spuštění:**
```bash
cd JidloLepeFrontend
npm install
npx expo start
```

**Nastavení IP adresy backendu:**

Před spuštěním otevřete `config/api.ts` a nastavte IP adresu počítače, na kterém běží backend:

```ts
export const API_BASE_URL = 'http://192.168.x.x:8082';
```

**Přístup z mobilu:**

Připojte telefon ke stejné WiFi síti jako vývojářský stroj a naskenujte QR kód zobrazený po spuštění `expo start` v aplikaci Expo Go.

---

## 8. Struktura projektu

```
JidloLepe/
├── JidloLepeBackend/
│   └── src/main/java/org/example/
│       ├── JidloLepeApp.java               # Vstupní bod aplikace
│       ├── controller/
│       │   ├── AuthController.java         # POST /api/auth/login
│       │   ├── UserController.java         # GET/PUT /api/users/allergens
│       │   ├── AllergenController.java     # GET /api/allergens
│       │   └── ProductProxyController.java # GET /api/products/*
│       ├── dto/
│       │   ├── LoginDTO.java
│       │   ├── RegisterDTO.java
│       │   ├── AuthResponse.java
│       │   ├── UserDTO.java
│       │   ├── AllergenDTO.java
│       │   └── UpdateUserAllergensDto.java
│       ├── entity/
│       │   ├── User.java
│       │   ├── Allergen.java
│       │   └── Role.java
│       ├── repository/
│       │   ├── UserRepository.java
│       │   ├── AllergenRepository.java
│       │   └── RoleRepository.java
│       ├── service/
│       │   ├── AuthService.java
│       │   ├── AuthServiceImpl.java
│       │   ├── UserService.java
│       │   ├── AllergenService.java
│       │   └── UserDetailsServiceImpl.java
│       ├── security/
│       │   ├── SecurityConfig.java
│       │   ├── JwtUtil.java
│       │   └── JwtRequestFilter.java
│       └── swagger/
│           └── SwaggerConfig.java
│
└── JidloLepeFrontend/
    ├── app/
    │   ├── (tabs)/
    │   │   ├── index.tsx       # Hlavní obrazovka
    │   │   ├── scan.tsx        # Skenování čárového kódu
    │   │   ├── profile.tsx     # Profil / přihlášení
    │   │   ├── fav.tsx         # Oblíbené
    │   │   └── search.tsx      # Vyhledávání
    │   ├── Product/
    │   │   └── [id].tsx        # Detail produktu
    │   └── AuthScreen.tsx
    ├── context/
    │   └── authContext.tsx     # Stav přihlášení (Context API)
    ├── services/
    │   ├── AuthService.ts      # login() – volání backendu
    │   ├── allergenService.ts  # (pozůstatek – nepoužíváno, nahrazeno backendem)
    │   └── openFoodFacts.ts    # searchProducts(), getProductByBarcode()
    └── config/
        └── api.ts              # API_BASE_URL – adresa backendu
```

> **Poznámka:** Soubor `services/allergenService.ts` obsahuje původní implementaci přes Firebase Firestore, která je v aktuální verzi nahrazena backendem. Soubor je zachován jako historický pozůstatek a v produkčním kódu se nepoužívá.

---

## 9. Kontakt

Autor: **Jitka Kroupová** – studentka UPCE FEI

Repozitář: [github.com/Avarza/jidlolepe](https://github.com/Avarza/jidlolepe)
