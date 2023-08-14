import apiRouter from './router';

export default {
  async fetch(request, env, ctx) {
    // You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      // You can also use more robust routing
      return apiRouter.fetch(request, env, ctx);
    }

    return new Response('These are not the droids you are looking for', { status: 404 });
  }
};
