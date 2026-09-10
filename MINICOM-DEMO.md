# SANTRACK — MINICOM Demo Competitive Positioning

## 1. What Existing Trace & Track Systems Do (and Where They Fail)

### Rwanda / EAC Regional Systems

| System | What it does | Critical gaps |
|---|---|---|
| **Rwanda FDA eTracking** | Tracks registered medicines via a centralized database. Inspectors log findings manually. | Paper-heavy inspection workflow. No real-time QR scan to verify authenticity without contacting the FDA directly. No supply chain movement tracking beyond registration. |
| **RRA e-Tax / EBM** | Records sales transactions for tax purposes. | Zero product traceability. Does not track what was sold — only that a sale occurred. No batch, expiry, or origin data. |
| **EAC Trade Portal** | Cross-border trade document management. | Documents, not products. No item-level serialization. No consumer-facing verification. |
| **Rwanda Agri-Export (NAEB)** | Tracks tea, coffee, horticultural exports at batch level. | Export only. No domestic supply chain visibility. No retailer or consumer endpoint. |

### Global Systems

| System | What it does | Critical gaps |
|---|---|---|
| **GS1 / GS1 Rwanda** | Barcode standards (EAN, GS1-128, GS1 DataMatrix). Global standard for product identification. | A standard, not a platform. Does not track events. Scanning a GS1 code tells you what the product is — it says nothing about whether this specific unit is real, recalled, or in compliance. |
| **IBM Food Trust** | Blockchain-backed food traceability for large enterprises (Walmart, Carrefour). | Requires blockchain node infrastructure. Minimum viable deployment costs six figures. No SME path. Rwanda has no node operators. No regulator integration. |
| **FoodLogiQ** | US-focused food safety and supplier compliance platform. | No Africa localization. No multilingual (Kinyarwanda/Swahili). No integration with Rwanda FDA or RRA. SaaS pricing excludes SMEs. |
| **TraceLink** | Pharmaceutical serialization for US DSCSA compliance. | Pharma-only. Requires ERP integration (SAP, Oracle). Out of reach for most Rwandan manufacturers. |
| **SAP Traceability** | Enterprise-grade batch tracing embedded in SAP ERP. | Requires SAP. No standalone path. Implementation cost exceeds most East African manufacturers' annual IT budgets. |
| **Mobi2Go / Foodsteps** | Carbon footprint and supply chain for Western food brands. | Sustainability focus, not compliance or consumer safety. No regulatory workflow. |

---

## 2. What SANTRACK Does Differently (MINICOM Demo Points)

### A. Zero-Cost Consumer Verification
- **Any smartphone, no app install required.** Consumer scans the QR → lands on `/verify?code=<token>` → sees product name, origin, certifications, expiry, authentic/counterfeit flag.
- Competing systems require either an app, a hotline, or an IMEI-style SMS.

### B. Two-Tier QR — Same Code, Different Views
- **Consumer tier**: Public page with only safe, useful consumer information.
- **Authenticated tier**: System users (regulators, shops, distributors) scan the same code in the dashboard and get full operational data — batch history, chain of custody, compliance flags.
- No competing system in Rwanda offers tiered access from a single QR.

### C. Dynamic, Signed QR Codes
- Codes resolve to a server endpoint, not a static URL. The data returned is always current.
- Signing: each code embeds a HMAC token. The server rejects cloned/fabricated codes.
- A recalled batch that was printed six months ago returns a RECALLED status today when scanned — the physical label does not change, but what it resolves to does.

### D. Regulator Workflow Built In — No Door-to-Door Inspection Required
- A regulator can scan any product at a market stall and immediately see: license validity, batch origin, certifications, open compliance cases.
- Rwanda FDA currently requires field inspectors to call back to headquarters to cross-reference registration numbers.
- SANTRACK eliminates that call — the answer is in the scan.

### E. Small Business First
- **Onboarding in under 10 minutes**: enter business name, TIN, select sector → submit → regulator approves → live.
- No ERP integration required. No technical knowledge needed for daily use.
- A single-person shop can record every sale with a QR scan on their phone.

### F. Full Supply Chain Lineage
- From raw material intake → production batch → packaged unit → dispatch → receipt → retail sale → consumer scan.
- Every step timestamped, georeferenced (district level), and actor-attributed.
- IBM Food Trust does this — at 100× the cost, with no Rwanda instance.

### G. Regulatory Compliance Automation
- License expiry alerts fire 90, 30, and 7 days before expiry.
- Compliance cases auto-flag when inspections find violations.
- Recall propagation: mark a batch recalled → every downstream holder is notified instantly.

---

## 3. MINICOM-Specific Talking Points

1. **Rwanda Made, Rwanda Deployed**: The system respects the local regulatory structure (Rwanda FDA, RDB, RRA). No mapping exercise required — it was designed around Rwandan organization types and licensing categories.

2. **EAC Expansion Ready**: The organization and licensing model supports cross-border operations. A manufacturer registered in Rwanda who distributes into Uganda can operate both under one account.

3. **Tax Linkage Potential**: Every sale recorded in SANTRACK carries a product code, quantity, and buyer. RRA EBM integration is a single API bridge away.

4. **Sector Coverage**: Food & Beverage, Pharmaceuticals, Cosmetics, Mining, Agriculture/Exports, General Manufacturing — all handled. The regulator is not locked to one industry.

5. **Jobs and Capacity**: Every business that onboards employs workers tracked in the HR module. The platform accumulates sector-level employment and production data the government does not currently have at this granularity.

---

## 4. What We Claim No One Else Does, Combined

| Capability | SANTRACK | GS1 | IBM Food Trust | Rwanda FDA | TraceLink |
|---|---|---|---|---|---|
| Consumer verification without an app | ✅ | ❌ | ❌ | ❌ | ❌ |
| Two-tier QR (public + authenticated) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Built-in regulator portal | ✅ | ❌ | ❌ | Partial | ❌ |
| SME onboarding < 10 min | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dynamic signed QR (anti-counterfeit) | ✅ | ❌ | Partial | ❌ | Partial |
| Rwanda FDA / RDB alignment | ✅ | Partial | ❌ | N/A | ❌ |
| Multilingual (EN / SW / KIN) | ✅ | ❌ | ❌ | ❌ | ❌ |
| No app install for consumer | ✅ | ❌ | ❌ | ❌ | ❌ |
| Affordable for a single shop | ✅ | ❌ | ❌ | N/A | ❌ |
