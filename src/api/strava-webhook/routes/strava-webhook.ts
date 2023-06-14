export default {
  routes: [
    {
     method: 'GET',
     path: '/strava-webhook',
     handler: 'strava-webhook.getAction',
     config: {
       policies: [],
       middlewares: [],
       auth: false,
       prefix: ""
     },
    },
    {
      method: 'POST',
      path: '/strava-webhook',
      handler: 'strava-webhook.postAction',
      config: {
        policies: [],
        middlewares: [],
      },
     }
  ],
};
