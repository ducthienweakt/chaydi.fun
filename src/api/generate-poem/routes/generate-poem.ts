export default {
  routes: [
    {
     method: 'GET',
     path: '/generate-poem',
     handler: 'generate-poem.getAction',
     config: {
       policies: [],
       middlewares: [],
     },
    },
  ],
};
