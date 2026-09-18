import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('@/pages/Home.vue');
const About = () => import('@/pages/About.vue');
const Contact = () => import('@/pages/Contact.vue');
const PrivacyPolicy = () => import('@/components/layout/LegalPage.vue');
const TermsAndConditions = () => import('@/components/layout/LegalPage.vue');
const Accessibility = () => import('@/components/layout/LegalPage.vue');
const CookiePolicy = () => import('@/components/layout/LegalPage.vue');
const Services = () => import('@/pages/Services.vue');
const Equipment = () => import('@/pages/Equipment.vue');
const Safety = () => import('@/pages/Safety.vue');
const Employment = () => import('@/pages/Employment.vue');
const ProjectDetail = () => import('@/pages/ProjectDetail.vue');
const TeamProjectDetail = () => import('@/pages/TeamProjectDetail.vue');
const NotFound = () => import('@/pages/NotFound.vue');

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/about',
    name: 'About',
    component: About,
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact,
  },
  {
    path: '/privacy-policy',
    name: 'Privacy Policy',
    component: PrivacyPolicy,
  },
  {
    path: '/terms-and-conditions',
    name: 'Terms & Conditions',
    component: TermsAndConditions,
  },
  {
    path: '/accessibility',
    name: 'Accessibility Statement',
    component: Accessibility,
  },
  {
    path: '/cookie-policy',
    name: 'Cookie Policy',
    component: CookiePolicy,
  },
  {
    path: '/services',
    name: 'Services',
    component: Services,
  },
  {
    path: '/equipment',
    name: 'Equipment',
    component: Equipment,
  },
  {
    path: '/safety',
    name: 'Safety',
    component: Safety,
  },
  {
    path: '/employment',
    name: 'Employment',
    component: Employment,
  },
  {
    path: '/portfolio/:slug',
    name: 'ProjectDetail',
    component: ProjectDetail,
  },
  {
    path: '/team-projects/:slug',
    name: 'TeamProjectDetail',
    component: TeamProjectDetail,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

export default router;
