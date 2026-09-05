<div align="center">

# 🚂 KANDYPACK.LK 🚂

### Rail & Road Based Supply Chain Distribution System

*From Kandy to the coast - one seamless journey, tracked in real time.*

[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://gsap.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue)](https://www.framer.com/motion/)

</div>

---

## 🌿 About

**Kandypack** replaces a legacy Excel based logistics workflow with a modern,
database driven distribution platform - shipping FMCG goods from Kandy to six
regional hubs (**Colombo · Negombo · Galle · Matara · Jaffna · Trincomalee**) by
train, then completing last-mile delivery by truck.

This repository holds the **public customer facing frontend** - the landing
experience and core customer app (auth, ordering, live tracking, order
history) built to feel like a premium, modern product, not a legacy
enterprise tool.

> Built as part of the **CS3043 Database Systems** module project at the
> CSE batch 24 ,University of Moratuwa - Group 20.

---

## ✨ Highlights

- 🟢 **Light Green Glass** design system - soft glassmorphism panels floating
  over animated aurora-gradient backgrounds
- 🎬 **Scroll scrubbed cinematic hero** - a photo sequence that plays like a
  video as you scroll, Apple-product-page style
- 🧊 Consistent glass UI across every surface - nav, cards, forms, modals
- 🎞️ Motion throughout - staggered scroll reveals, spring hover states,
  animated count-up stats, animated order-tracking timeline
- ♿ Full `prefers-reduced-motion` + mobile fallback support - no user is
  ever stuck loading something they didn't ask for
- 📱 Fully responsive, mobile first

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14+](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (custom green design tokens) |
| Animation | Framer Motion (`motion`) + GSAP ScrollTrigger |
| Smooth Scroll | Lenis |
| Icons | lucide react |

The full visual language — colors, glass rules, typography, motion, do's &
don'ts — lives in [`DESIGN.md`](./DESIGN.md). Any AI coding agent (or human!)
working on this repo should read that first.

---

## 🚀 Getting Started

```bash
# clone the repo
git clone https://github.com/KandyPackGroup20/FrontEnd_2.0.git
cd FrontEnd_2.0

# install dependencies
npm install

# run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

---

## 📁 Project Structure

kandypack-sl/
├── app/
│ ├── page.tsx # Landing page
│ ├── layout.tsx # Root layout
│ ├── login/ # Auth screens
│ ├── register/
│ ├── order/ # Multi-step order flow
│ ├── orders/ # Order history + live tracking
│ └── profile/ # Account & saved addresses
├── components/
│ ├── hero/ # Scroll-scrubbed sequence hero
│ ├── sections/ # Landing page sections
│ └── ui/ # Shared glass UI primitives
├── public/
│ └── images/
│ ├── sequence/ # Hero scroll-sequence frames
│ └── icons/ # Feature & step icons
├── DESIGN.md # 🎨 Design system reference
└── README.md


---

## 🎨 Design System

This project follows a documented design system rather than ad-hoc styling —
see [`DESIGN.md`](./DESIGN.md) for the full spec:

- Color tokens & roles
- Typography scale
- The `.glass` component pattern
- Motion language & easing rules
- Responsive & accessibility behavior

---

## 👥 Team — Group 20

| Member | Focus Area |
|---|---|
| Gunasekara P.S.I | Identity, Access & Security |
| Kethmika K.A.D.Y. | Rail Capacity Allocation & Spillover |
| Praghathees K. | Truck Roster & Driver Assignment Engine |
| Indrasiri K.B.S.H. | Station Inventory & Warehouse Operations |
| Sewwandi P.D.Y. | Reporting, Analytics & QA |

*Department of Computer Science & Engineering, University of Moratuwa*

---

## 📜 License

This project is built for academic purposes as part of CS3043 — Database
Systems. All rights reserved by Group 20 unless otherwise stated.

---

<div align="center">

**Built with 💚 and a lot of scroll-jank debugging.**

</div>
