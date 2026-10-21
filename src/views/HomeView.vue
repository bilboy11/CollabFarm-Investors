<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import heroImage from '@/assets/images/Hero Image.png'
import africanFarmer from '@/assets/images/African farmer.png'
import farmerProfile from '@/assets/images/Farmer profile photo.png'
import femaleFarmer from '@/assets/images/female african farmer.png'
import associationsImage from '@/assets/images/Associations Image.png'
import investorsImage from '@/assets/images/Investors Image.png'
import identityImage from '@/assets/images/Identity Verification.png'
import logoSrc from '@/assets/images/Logo.png'
import collabFinanceImage from '@/assets/images/Collab Finance.png'
import ctaImage from '@/assets/images/CTA.png'
import xLogo from '@/assets/images/XLogo.png'
import instagramLogo from '@/assets/images/InstagramLogo.png'
import threadsLogo from '@/assets/images/ThreadsLogo.png'
import facebookLogo from '@/assets/images/FacebookLogo.png'

const router = useRouter()

function openInvestorPortal() {
  const token = localStorage.getItem('access_token')
  if (!token) {
    router.push('/login')
    return
  }

  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) throw new Error('Invalid session token')
    const base64Payload = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=')
    const payload = JSON.parse(atob(paddedPayload)) as { exp?: number }
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem('access_token')
      router.push('/login')
      return
    }
  } catch {
    localStorage.removeItem('access_token')
    router.push('/login')
    return
  }

  router.push('/dashboard')
}

const highlights = [
  { label: 'Verified Farmers', pill: true },
  { label: 'Trusted Associations', pill: false },
  { label: 'GPS Verified Farms', pill: false },
  { label: 'Investment Tracking', pill: false },
]

const coopAvatars = [femaleFarmer, farmerProfile, farmerProfile, africanFarmer]

const platformStats = [
  { id: 'farmers', value: '—', label: 'Verified\nFarmers', avatars: [africanFarmer, farmerProfile, femaleFarmer] },
  { id: 'cooperatives', value: '—', label: 'Cooperatives\nRegistered', icon: 'people' },
  { id: 'associations', value: '—', label: 'Associations\nOnboarded', icon: 'handshake' },
  { id: 'investments', value: '—', label: 'Investment\nFacilitated', icon: 'naira' },
]

const farmerBadges = [
  { label: 'Verified Profiles', tone: 'green' },
  { label: 'GPS Verified Lands', tone: 'blue' },
  { label: 'Risk Assessed', tone: 'orange' },
]

const associationChips = [
  { label: 'Regional Coverage', icon: 'pin' },
  { label: 'Strategic Programs', icon: 'nodes' },
  { label: 'Large Scale Impact', icon: 'bars' },
]

const investorFeatures = [
  'Risk Analysis',
  'Due Diligence',
  'Portfolio Tracking',
  'Return Monitoring',
]

const identityFeatures = [
  {
    title: 'GPS Mapping',
    text: 'Track farm locations with precise geolocation for better planning and transparency.',
  },
  {
    title: 'Field Visits',
    text: 'On-site inspections to verify farm activities and collect accurate ground data.',
  },
  {
    title: 'Document Authentication',
    text: 'Secure and verify identity and ownership through official document validation.',
  },
  {
    title: 'AI Risk Scoring',
    text: 'Automatically assess risk levels using intelligent algorithms and data analysis.',
  },
]

const whyFeatures = [
  {
    title: 'Comprehensive Verification',
    text: 'Multi-layer verification process ensures authentic farmer profiles and reduces investment risk.',
    tone: 'green',
  },
  {
    title: 'GPS Land Verification',
    text: 'Satellite-verified land mapping provides accurate farm size and location data for investors.',
    tone: 'gold',
  },
  {
    title: 'Smart Risk Assessment',
    text: 'AI-powered risk scoring helps investors make informed decisions with transparent metrics.',
    tone: 'green',
  },
]

const previewMetrics = [
  { label: 'Total Invested', value: '—', tone: 'neutral' },
  { label: 'Current Value', value: '—', tone: 'gold' },
  { label: 'Total Returns', value: '—', tone: 'green' },
  { label: 'Active Investments', value: '—', tone: 'blue' },
]
const previewTab = ref('Portfolio Overview')
const previewTabs = ['Portfolio Overview', 'My Investments', 'New Opportunities']

const socialLinks = [
  { label: 'X', href: '#x', icon: xLogo },
  { label: 'Instagram', href: '#instagram', icon: instagramLogo },
  { label: 'Threads', href: '#threads', icon: threadsLogo },
  { label: 'Facebook', href: '#facebook', icon: facebookLogo },
]

const footerColumns = [
  {
    title: 'Platform',
    links: [
      { label: 'Investor Portal', href: '#investor-portal' },
      { label: 'Verification Process', href: '#how-it-works' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '#contact' },
      { label: 'Contact Us', href: '#contact' },
      { label: 'Verification Guide', href: '#how-it-works' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
    ],
  },
]
</script>

<template>
  <main class="page">
    <!-- Hero -->
    <section class="hero" aria-label="CollabFarm Finance introduction">
      <img class="hero__bg" :src="heroImage" width="1512" height="884" alt="" />
      <div class="hero__scrim" aria-hidden="true"></div>

      <div class="hero__content">
        <div class="hero__copy">
          <p class="badge">Verified Farmers</p>
          <h1>Connecting Farmers, Cooperatives and Investors Through Verified Agricultural Data</h1>
          <p class="lead">
            CollabFarm helps associations, cooperatives, and investors collaborate through verified
            farmer records, location intelligence, and transparent investment tracking—building
            trust across Nigeria’s agricultural ecosystem.
          </p>
          <div class="hero__actions">
            <a class="btn btn--primary" href="/dashboard" @click.prevent="openInvestorPortal">Investor Portal →</a>
            <a class="btn btn--light hero__btn-light" href="/signup">Get Started</a>
          </div>
        </div>
        <ul class="highlights" aria-label="Platform highlights">
          <li
            v-for="item in highlights"
            :key="item.label"
            :class="{ 'highlights__item--pill': item.pill }"
          >
            {{ item.label }}
          </li>
        </ul>
      </div>
    </section>

    <section class="stats" aria-label="Platform impact">
      <div class="stats__inner">
        <article v-for="stat in platformStats" :key="stat.id" class="stat">
          <div v-if="stat.avatars" class="avatars" aria-hidden="true">
            <img v-for="(src, index) in stat.avatars" :key="index" :src="src" alt="" />
          </div>
          <div v-else class="icon" aria-hidden="true">{{ stat.icon === 'naira' ? '₦' : '•' }}</div>
          <p class="stat__text"><strong>{{ stat.value }}</strong><span>{{ stat.label }}</span></p>
        </article>
      </div>
    </section>

    <!-- Explore Platform -->
    <section id="solutions" class="section">
      <div class="section__inner">
        <header class="section__header">
          <h2 id="explore-title">Explore Our Platform</h2>
          <p>Navigate through our comprehensive agricultural finance ecosystem</p>
        </header>

        <div class="bento content-max">
          <article class="tile tile--farmers">
            <h3>Farmers</h3>
            <p>
              Browse verified farmer profiles with detailed information, funding requirements, and
              investment opportunities.
            </p>
            <ul class="pills">
              <li v-for="badge in farmerBadges" :key="badge.label" :class="`pill--${badge.tone}`">
                {{ badge.label }}
              </li>
            </ul>
          </article>

          <article class="tile tile--coops">
            <h3>Cooperatives</h3>
            <p>
              Explore farmer cooperatives with collective farming initiatives, shared resources, and
              group investments.
            </p>

            <div class="coop" aria-hidden="true">
              <svg class="coop__lines" viewBox="0 0 280 78" fill="none">
                <path d="M140 8 C118 18 72 28 42 58" />
                <path d="M140 8 C128 20 112 34 98 58" />
                <path d="M140 8 C152 20 168 34 182 58" />
                <path d="M140 8 C162 18 208 28 238 58" />
              </svg>

              <div class="coop__hub">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="10" cy="8.5" r="3" stroke="#fff" stroke-width="1.6" />
                  <circle cx="15.2" cy="9.4" r="2.4" stroke="#fff" stroke-width="1.5" />
                  <path
                    d="M4.8 18c.8-2.9 2.8-4.4 5.2-4.4 1 0 1.9.2 2.6.7"
                    stroke="#fff"
                    stroke-width="1.6"
                    stroke-linecap="round"
                  />
                  <path
                    d="M13.2 15.2c1-.4 2.1-.6 3.3-.4 2.2.3 3.6 1.8 4.2 3.9"
                    stroke="#fff"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </div>

              <div class="coop__row">
                <img v-for="(src, i) in coopAvatars" :key="i" :src="src" alt="" />
              </div>
            </div>
          </article>

          <article class="tile tile--photo tile--assoc">
            <img :src="associationsImage" alt="" />
            <div class="overlay overlay--bottom">
              <h3>Associations</h3>
              <p>
                Discover agricultural associations that coordinate multiple cooperatives and drive
                sector-wide initiatives.
              </p>
              <ul class="chips">
                <li v-for="chip in associationChips" :key="chip.label">
                  <svg
                    v-if="chip.icon === 'pin'"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 1.3C4.3 1.3 3 2.6 3 4.2 3 6.6 6 10.2 6 10.2S9 6.6 9 4.2C9 2.6 7.7 1.3 6 1.3Zm0 4.1A1.3 1.3 0 1 1 6 2.8a1.3 1.3 0 0 1 0 2.6Z"
                      fill="currentColor"
                    />
                  </svg>
                  <svg
                    v-else-if="chip.icon === 'nodes'"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="6" cy="3" r="1.35" stroke="currentColor" stroke-width="1.2" />
                    <circle cx="3" cy="8.2" r="1.35" stroke="currentColor" stroke-width="1.2" />
                    <circle cx="9" cy="8.2" r="1.35" stroke="currentColor" stroke-width="1.2" />
                    <path d="M6 4.4 3.6 7M6 4.4 8.4 7" stroke="currentColor" stroke-width="1.2" />
                  </svg>
                  <svg
                    v-else
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.2 9.5V6.4M5 9.5V3.6M7.8 9.5V5.4M10.5 9.5V2.9"
                      stroke="currentColor"
                      stroke-width="1.4"
                      stroke-linecap="round"
                    />
                  </svg>
                  {{ chip.label }}
                </li>
              </ul>
            </div>
          </article>

          <article class="tile tile--photo tile--investors">
            <img :src="investorsImage" alt="" />
            <div class="overlay overlay--top">
              <h3>Investors</h3>
              <p>
                Access thoroughly vetted agricultural opportunities with transparent risk
                assessments, verified data, and comprehensive farmer profiles.
              </p>
              <ul class="features">
                <li v-for="item in investorFeatures" :key="item">{{ item }}</li>
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Identity Verification -->
    <section id="how-it-works" class="section">
      <div class="section__inner">
        <header class="section__header">
          <h2 id="identity-title">Secure Identity Verification</h2>
          <p>Ensures transparency and safety with layered checks and real-time monitoring.</p>
        </header>

        <div class="stage content-max round-media">
          <img
            :src="identityImage"
            width="1208"
            height="610"
            alt="Farmers working together in the field during verification"
          />
          <ul class="verify-cards" aria-label="Verification methods">
            <li v-for="item in identityFeatures" :key="item.title">
              <h3>{{ item.title }}</h3>
              <p>{{ item.text }}</p>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Ecosystem Integration -->
    <section id="about" class="section">
      <div class="section__inner section__inner--wide-gap">
        <header class="section__header">
          <h2 id="ecosystem-title">Ecosystem Integration</h2>
          <p>
            All stakeholders work together in a unified platform, creating trust, transparency, and
            mutual success in agricultural finance.
          </p>
        </header>

        <div class="dash content-max" aria-label="Investor Dashboard preview">
          <div class="dash__top">
            <div class="dash__brand">
              <img :src="logoSrc" alt="" />
              <span class="divider" aria-hidden="true"></span>
              <strong>Investor Dashboard</strong>
            </div>
            <a href="/">← Back to Home</a>
          </div>

          <div class="metrics">
            <article v-for="metric in previewMetrics" :key="metric.label" class="metric">
              <div><p class="label">{{ metric.label }}</p><p class="value">{{ metric.value }}</p></div>
              <span class="dot" :class="`dot--${metric.tone}`" aria-hidden="true"></span>
            </article>
          </div>
          <div class="tabs" role="tablist">
            <button v-for="name in previewTabs" :key="name" type="button" class="tab" :class="{ 'tab--on': previewTab === name }" @click="previewTab = name">{{ name }}</button>
          </div>
          <div class="panels">
            <article class="panel"><h3>Portfolio Performance</h3><div class="chart"><p>Performance Chart</p><small>Interactive chart coming soon</small></div></article>
            <article class="panel"><h3>Recent Activity</h3><p>No recent activity.</p></article>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Choose -->
    <section id="why-choose" class="section">
      <div class="section__inner">
        <header class="section__header">
          <h2>Why Choose CollabFarm Finance?</h2>
          <p>Built with verification, transparency, and trust at its core.</p>
        </header>

        <div class="why-grid content-max">
          <article
            v-for="item in whyFeatures"
            :key="item.title"
            class="why-card"
            :class="`why-card--${item.tone}`"
          >
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>

          <div class="why-media round-media">
            <img
              :src="collabFinanceImage"
              width="1208"
              height="607"
              alt="Greenhouse team harvesting fresh produce"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- CTA + Footer -->
    <section id="contact" class="section closing">
      <div class="section__inner">
        <div class="cta content-max round-media">
          <img :src="ctaImage" width="1208" height="582" alt="" />
          <div class="cta__scrim" aria-hidden="true"></div>
          <div class="cta__content">
            <h2>Ready to Transform Agricultural Investment?</h2>
            <p>
              Join verified farmers and smart investors who trust CollabFarm Finance for
              transparent, risk-assessed agricultural investments.
            </p>
            <div class="cta__actions">
              <a class="btn btn--light" href="/dashboard" @click.prevent="openInvestorPortal">Investor Portal →</a>
              <a class="btn btn--glass" href="/signup">Get Started →</a>
            </div>
          </div>
        </div>

        <footer class="footer content-max">
          <div class="footer__grid">
            <div class="footer__brand">
              <a href="/" aria-label="CollabFarm Finance home">
                <img :src="logoSrc" alt="CollabFarm Finance" />
              </a>
              <p>
                Connecting verified farmers with smart investors through comprehensive verification
                and risk assessment.
              </p>
              <div class="social" aria-label="Social media">
                <a
                  v-for="item in socialLinks"
                  :key="item.label"
                  :href="item.href"
                  :aria-label="item.label"
                >
                  <img :src="item.icon" :alt="item.label" width="16" height="16" />
                </a>
              </div>
            </div>

            <div v-for="col in footerColumns" :key="col.title">
              <h3>{{ col.title }}</h3>
              <ul>
                <li v-for="link in col.links" :key="link.label">
                  <a :href="link.href">{{ link.label }}</a>
                </li>
              </ul>
            </div>
          </div>

          <div class="footer__bar">
            <p>Copyright © 2026 <span>CollabFarm Finance</span> All Rights Reserved.</p>
          </div>
        </footer>
      </div>
    </section>
  </main>

</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
}

/* —— Hero —— */
.hero {
  position: relative;
  min-height: min(884px, calc(100vh - var(--header-height)));
  color: #fff;
  overflow: hidden;
  background: #1a2e24;
}

.hero__bg,
.hero__scrim {
  position: absolute;
  inset: 0;
}

.hero__bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero__scrim {
  background:
    linear-gradient(90deg, rgba(10, 24, 18, 0.72), rgba(10, 24, 18, 0.2) 70%),
    linear-gradient(180deg, transparent 40%, rgba(10, 24, 18, 0.55));
}

.hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2rem;
  max-width: var(--layout-max);
  min-height: inherit;
  margin: 0 auto;
  padding: clamp(40px, 6vw, 72px) var(--page-pad-x) clamp(24px, 4vw, 40px);
}

.hero__copy {
  max-width: 740px;
}

.badge {
  display: inline-flex;
  margin-bottom: 1.25rem;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius-pill);
  background: rgba(232, 240, 228, 0.9);
  color: var(--color-green-800);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero h1 {
  margin-bottom: 1rem;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4.5vw, 3.55rem);
  font-weight: 600;
  line-height: 1.12;
}

.lead {
  max-width: 620px;
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.92);
  font-size: clamp(0.95rem, 2vw, 1.05rem);
  line-height: 1.65;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero__btn-light {
  background: rgba(236, 236, 230, 0.85);
  color: var(--color-ink);
}

.highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.highlights li {
  font-size: 0.92rem;
  font-weight: 500;
}

.highlights__item--pill {
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-pill);
  background: rgba(205, 224, 196, 0.92);
  color: var(--color-green-900);
}

/* —— Stats —— */
.stats {
  background: var(--color-stats-bg);
  color: #fff;
  border-bottom: var(--stroke-05) solid rgba(255, 255, 255, 0.12);
  font-family: var(--font-body);
}

.stats :is(h1, h2, h3, h4, strong) {
  font-family: var(--font-display);
}

.stats__inner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  max-width: var(--layout-max);
  margin: 0 auto;
  padding: clamp(28px, 5vw, 68px) var(--page-pad-x);
}

.stat {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.avatars {
  position: relative;
  width: 104px;
  height: 56px;
  flex-shrink: 0;
}

.avatars img {
  position: absolute;
  top: 0;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-stats-bg);
}

.avatars img:nth-child(1) {
  left: 0;
  z-index: 1;
}
.avatars img:nth-child(2) {
  left: 24px;
  z-index: 2;
}
.avatars img:nth-child(3) {
  left: 48px;
  z-index: 3;
}

.icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border: 1.5px solid var(--color-gold);
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: 600;
}

.stat__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.2;
  min-width: 0;
}

.stat__text strong {
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 2vw, 1.35rem);
  font-weight: 700;
}

.stat__text span {
  white-space: pre-line;
  font-size: 0.92rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
}

/* —— Explore Platform —— */
.bento {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: minmax(260px, 299px) minmax(260px, 299px);
  gap: 24px;
}

.tile {
  overflow: hidden;
  border: var(--stroke-05) solid rgba(30, 50, 40, 0.12);
  border-radius: var(--radius-9);
  background: #e8ebe6;
  padding: 1.25rem;
}

.tile h3 {
  margin-bottom: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--color-ink);
}

.tile p {
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--color-ink-soft);
}

.tile--farmers,
.tile--coops {
  display: flex;
  flex-direction: column;
}

.tile--farmers {
  background:
    repeating-linear-gradient(
      -12deg,
      transparent,
      transparent 18px,
      rgba(255, 255, 255, 0.35) 18px,
      rgba(255, 255, 255, 0.35) 34px
    ),
    #e8ebe6;
}

.pills,
.chips {
  list-style: none;
  margin: auto 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pills li,
.chips li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: 0.72rem;
  font-weight: 600;
}

.pill--green {
  color: #1f6b45;
  background: #dff3e6;
}
.pill--blue {
  color: #2a6f9b;
  background: #e3f1fb;
}
.pill--orange {
  color: #b5681d;
  background: #f8ebda;
}

.coop {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: auto;
  min-height: 120px;
  padding-top: 0.5rem;
}

.coop__lines {
  position: absolute;
  left: 50%;
  top: 26px;
  width: min(100%, 280px);
  height: 78px;
  transform: translateX(-50%);
  pointer-events: none;
}

.coop__lines path {
  fill: none;
  stroke: #c5cbc4;
  stroke-width: 1.4;
  stroke-dasharray: 3.5 3.5;
  stroke-linecap: round;
}

.coop__hub {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(145deg, #1f4d3a 0%, #3f6b3a 42%, #c6a247 100%);
  box-shadow: 0 8px 18px rgba(27, 77, 62, 0.22);
}

.coop__row {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 28px;
  width: 100%;
}

.coop__row img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: #dfe5dc;
}

.tile--photo {
  position: relative;
  padding: 0;
  color: #fff;
}

.tile--photo > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tile--assoc {
  grid-column: 1 / span 2;
}

.tile--investors {
  grid-column: 3;
  grid-row: 1 / span 2;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 1.35rem;
}

.overlay--bottom {
  justify-content: flex-end;
  align-items: stretch;
  background: linear-gradient(180deg, rgba(12, 28, 20, 0.05) 35%, rgba(12, 28, 20, 0.78) 100%);
}

.overlay--bottom > * {
  max-width: 100%;
}

.tile--assoc .overlay {
  justify-content: flex-end;
}

.tile--assoc h3,
.tile--assoc p,
.tile--assoc .chips {
  margin-top: 0;
}

.tile--assoc h3 {
  margin-top: auto;
}

.overlay--top {
  justify-content: flex-start;
  background: linear-gradient(
    180deg,
    rgba(16, 36, 56, 0.78) 0%,
    rgba(16, 36, 56, 0.28) 42%,
    rgba(12, 28, 20, 0.35) 100%
  );
}

.overlay h3,
.overlay p {
  color: #fff;
}

.overlay h3 {
  font-size: 1.55rem;
}

.overlay p {
  max-width: 34rem;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.94);
}

.chips li {
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(236, 244, 236, 0.88);
  color: var(--color-green-800);
}

.features {
  list-style: none;
  margin: 0.2rem 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem 1.15rem;
}

.features li {
  position: relative;
  padding-left: 0.9rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.96);
}

.features li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fff;
}

/* —— Identity Verification —— */
.stage {
  position: relative;
  min-height: 0;
}

.stage img {
  width: 100%;
  height: clamp(240px, 45vw, 610px);
  object-fit: cover;
}

.verify-cards {
  position: absolute;
  inset: auto 16px 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.verify-cards li {
  padding: 1rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 24px rgba(16, 36, 28, 0.12);
}

.verify-cards h3 {
  margin-bottom: 0.4rem;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-green-800);
}

.verify-cards p {
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--color-ink-soft);
}

/* —— Ecosystem —— */
.section__inner--wide-gap {
  gap: 56px;
}

.dash {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 24px;
  background: #eef1ec;
}

.dash__top,
.dash__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dash__top {
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
}

.dash__brand {
  justify-content: flex-start;
  min-width: 0;
}

.dash__brand img {
  height: 28px;
  width: auto;
}

.divider {
  width: 1px;
  height: 22px;
  background: #d5ddd7;
}

.dash__brand strong {
  font-family: var(--font-display);
  color: var(--color-green-800);
  white-space: nowrap;
}

.dashboard-preview-note {
  margin: 0;
  padding: 28px 20px;
  border-radius: 14px;
  background: #fff;
  color: var(--color-ink-soft);
  text-align: center;
  line-height: 1.6;
}

.metrics,
.panels {
  display: grid;
  gap: 12px;
}

.metrics {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.panels {
  grid-template-columns: 1.35fr 1fr;
}

.metric,
.panel {
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff;
}

.metric {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.label {
  margin-bottom: 0.3rem;
  font-size: 0.82rem;
  color: var(--color-ink-soft);
}

.value {
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2vw, 1.45rem);
  font-weight: 700;
}

.change {
  margin-top: 0.3rem;
  color: #2f8a4e;
  font-size: 0.82rem;
  font-weight: 700;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot--neutral {
  background: #9bb3a4;
}
.dot--gold {
  background: #c6a247;
}
.dot--green {
  background: #2f8a4e;
}
.dot--blue {
  background: #3a74a8;
}

.tabs {
  display: flex;
  gap: 6px;
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
  padding: 5px;
  border-radius: 12px;
  background: #e4e9e3;
}

.tab {
  border: 0;
  border-radius: 9px;
  padding: 0.55rem 0.9rem;
  background: transparent;
  color: var(--color-ink-soft);
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
}

.tab--on {
  background: #fff;
  color: var(--color-green-800);
}

.panel h3 {
  margin-bottom: 12px;
  font-family: var(--font-display);
  font-size: 1.05rem;
  color: var(--color-green-800);
}

.chart {
  display: grid;
  place-content: center;
  justify-items: center;
  min-height: 220px;
  border-radius: 12px;
  background: #f6f8f5;
  color: #7f8b82;
  text-align: center;
}

.panel ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.panel li {
  display: grid;
  grid-template-columns: 12px 1fr auto;
  gap: 10px;
  align-items: start;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef1ee;
}

.panel li:last-child {
  opacity: 0.72;
  border-bottom: 0;
}

.panel li .dot {
  margin-top: 7px;
}

.panel strong {
  display: block;
  font-family: var(--font-display);
  font-size: 0.9rem;
}

.panel p {
  margin-top: 2px;
  font-size: 0.8rem;
  color: var(--color-ink-soft);
}

.panel time {
  font-size: 0.75rem;
  color: #8a948c;
  white-space: nowrap;
}

/* —— Why Choose —— */
.why-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.why-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 183px;
  padding: var(--space-8);
  border-radius: var(--radius-9);
}

.why-card--green {
  background: var(--color-green-800);
  color: #fff;
}

.why-card--gold {
  background: #c9a84a;
  color: var(--color-green-900);
}

.why-card h3 {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
}

.why-card p {
  font-size: 0.9rem;
  line-height: 1.5;
}

.why-media {
  grid-column: 1 / -1;
}

.why-media img {
  width: 100%;
  height: clamp(220px, 40vw, 607px);
  object-fit: cover;
}

/* —— CTA + Footer —— */
.closing {
  background: #f3f5f1;
}

.cta {
  position: relative;
  min-height: clamp(320px, 55vw, 582px);
}

.cta img {
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
}

.cta__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(12, 28, 20, 0.35), rgba(12, 28, 20, 0.55));
}

.cta__content {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  text-align: center;
  color: #fff;
}

.cta__content h2 {
  max-width: 18ch;
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 600;
  line-height: 1.15;
}

.cta__content p {
  max-width: 42rem;
  color: rgba(255, 255, 255, 0.94);
  font-size: clamp(0.95rem, 2vw, 1.05rem);
  line-height: 1.6;
}

.cta__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer__grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.footer__brand img {
  height: 40px;
  width: auto;
}

.footer__brand p {
  max-width: 28rem;
  margin: 1rem 0 1.25rem;
  color: var(--color-ink-soft);
  font-size: 0.95rem;
  line-height: 1.6;
}

.social {
  display: flex;
  gap: 10px;
}

.social a {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-green-800);
}

.social img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.footer h3 {
  margin-bottom: 0.9rem;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-green-800);
}

.footer ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

.footer a {
  color: var(--color-ink-soft);
  font-size: 0.92rem;
}

.footer a:hover {
  color: var(--color-green-800);
}

.footer__bar {
  display: grid;
  place-items: center;
  min-height: 56px;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: #fff;
  text-align: center;
  color: var(--color-ink-soft);
  font-size: 0.9rem;
}

.footer__bar span {
  color: var(--color-green-800);
  font-family: var(--font-display);
  font-weight: 700;
}

/* —— Responsive —— */
@media (max-width: 1100px) {
  .stats__inner {
    grid-template-columns: 1fr 1fr;
  }

  .bento {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
  }

  .tile--assoc,
  .tile--investors,
  .tile--farmers,
  .tile--coops {
    grid-column: auto;
    grid-row: auto;
    min-height: 280px;
  }

  .tile--assoc,
  .tile--investors {
    grid-column: 1 / -1;
  }

  .tile--photo {
    min-height: 320px;
  }

  .verify-cards {
    grid-template-columns: 1fr 1fr;
  }

  .metrics,
  .panels {
    grid-template-columns: 1fr 1fr;
  }

  .dash__brand strong {
    display: none;
  }
}

@media (max-width: 900px) {
  .why-grid {
    grid-template-columns: 1fr;
  }

  .why-card {
    min-height: 0;
  }

  .footer__grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 700px) {
  .hero {
    min-height: auto;
  }

  .hero__content {
    min-height: calc(100svh - var(--header-height));
  }

  .stats__inner {
    grid-template-columns: 1fr;
  }

  .bento {
    grid-template-columns: 1fr;
  }

  .tile--assoc,
  .tile--investors {
    grid-column: 1;
  }

  .chips {
    gap: 8px;
  }

  .stage {
    overflow: visible;
  }

  .stage img {
    border-radius: var(--radius-9);
  }

  .verify-cards {
    position: static;
    margin-top: 12px;
    grid-template-columns: 1fr;
  }

  .metrics,
  .panels {
    grid-template-columns: 1fr;
  }

  .dash__top {
    flex-wrap: wrap;
  }

  .footer__grid {
    grid-template-columns: 1fr;
  }
}
</style>
