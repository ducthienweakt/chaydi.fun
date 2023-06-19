import service from "./../../strava-webhook/services/strava-webhook";

/**
 * A set of functions called "actions" for `generate-poem`
 */

export default {
  getAction: async (ctx, next) => {
    try {
      try {
        let poemType = ctx.request.query['poemType'];
        let poemSubject = ctx.request.query['poemSubject'];
        let poem = await service.generatePoem(poemType,poemSubject);
        ctx.body = {data:poem};
        ctx.status = 200;
      } catch (err) {
        ctx.body = err;
      }

    } catch (err) {
      ctx.body = err;
    }
  }
};
