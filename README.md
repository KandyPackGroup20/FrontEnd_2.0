<div align="center">

<img src="docs/screenshots/banner.png" alt="Kandypack banner" width="100%" />

# 🚂 KANDYPACK.LK 🚂

### Rail & Road Based Supply Chain Distribution System

*From Kandy to the coast - one seamless journey, tracked in real time.*

[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://gsap.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue)](https://www.framer.com/motion/)

[![Version](https://img.shields.io/badge/version-2.0-16A34A?style=flat-square)]()
[![Status](https://img.shields.io/badge/status-in--development-F59E0B?style=flat-square)]()

**[Live Demo](#) · [Design System](./DESIGN.md) · [Report an Issue](../../issues)**

</div>

<br/>

## 📚 Table of Contents

- [About](#-about)
- [Preview](#-preview)
- [Highlights](#-highlights)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Design System](#-design-system)
- [Team](#-team--group-20)
- [License](#-license)

---

## 🌿 About

**Kandypack** replaces a legacy Excel based logistics workflow with a modern,
database-driven distribution platform shipping FMCG goods from Kandy to six
regional hubs (**Colombo · Negombo · Galle · Matara · Jaffna · Trincomalee**) by
train, then completing last mile delivery by truck.

This repository holds the **public customer facing frontend** the landing
experience and core customer app (auth, ordering, live tracking, order
history) built to feel like a premium, modern product, not a legacy
enterprise tool.

> 🎓 Built as part of the **CS3043 Database Systems** module project,
> CSE Batch 24, University of Moratuwa - **Group 20**.

---

## 🎬 Preview

<div align="center">

<img src="docs/screenshots/hero-scroll.gif" alt="Scroll-scrubbed hero sequence" width="90%" />

*The signature scroll scrubbed hero scrolling plays through the shipment's journey like a video*

<br/><br/>

<img src="docs/screenshots/landing-page.png" alt="Landing page" width="45%" />
<img src="docs/screenshots/order-tracking.png" alt="Live order tracking" width="45%" />

*Landing page (left) · Real time order tracking timeline (right)*

</div>

> 📸 **Note for the team:** drop actual screenshots/GIFs into a `docs/screenshots/`
> folder at the repo root using the filenames above, and these will render
> automatically. A short screen recording of the hero scroll effect converted
> to GIF (via [ScreenToGif](https://www.screentogif.com/) or similar) sells
> this project hard worth prioritizing over the static screenshots.

---

## ✨ Highlights

| | |
|---|---|
| 🟢 **Light Green Glass** design system | Soft glassmorphism panels floating over animated aurora gradient backgrounds |
| 🎬 **Scroll scrubbed cinematic hero** | A photo sequence that plays like a video as you scroll Apple product page style |
| 🧊 **Consistent glass UI** | Every surface nav, cards, forms, modals follows one documented component pattern |
| 🎞️ **Motion throughout** | Staggered scroll reveals, spring hover states, animated count up stats, animated order tracking timeline |
| ♿ **Accessible by default** | Full `prefers-reduced-motion` + mobile fallback support no one is stuck loading something they didn't ask for |
| 📱 **Fully responsive** | Mobile-first from the ground up |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14+](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (custom green design tokens) |
| Animation | Framer Motion (`motion`) + GSAP ScrollTrigger |
| Smooth Scroll | Lenis |
| Icons | lucide-react |

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
