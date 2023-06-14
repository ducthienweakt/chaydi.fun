/**
 * A set of functions called "actions" for `strava-webhook`
 */
import service from "./../services/strava-webhook";

export default {
  getAction: async (ctx, next) => {
    try {
      const VERIFY_TOKEN = "STRAVA";
      // Parses the query params
      let mode = ctx.request.query['hub.mode'];
      let token = ctx.request.query['hub.verify_token'];
      let challenge = ctx.request.query['hub.challenge'];
      if (mode && token) {
        // Verifies that the mode and token sent are valid
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
          // Responds with the challenge token from the request
          console.log('WEBHOOK_VERIFIED');
          ctx.body = ({ "hub.challenge": challenge });
        } else {
          // Responds with '403 Forbidden' if verify tokens do not match
          ctx.sendStatus(403);
        }
      }
    } catch (err) {
      ctx.body = err;
    }
  },
  postAction: async (ctx, next) => {
    try {
      
      let event = ctx.request.body;
      let tokenObject =  await service.getTokenObj(event);
      console.log("getToken>>>", tokenObject);

      if(tokenObject){
        let content = "";
        let poem  = await service.generatePoem();
       // console.log("generatePoem>>>", poem);
  
        let activity = await service.getActivity(event.object_id, tokenObject.access_token);
        // console.log("getActivity>>>", activity);
  
        let title = service.getTitle(activity.distance);
        //console.log("title>>>", title);
       
        if(activity.start_latlng){
          let airMessage = await service.getAirQuality(activity.start_latlng[0],activity.start_latlng[1],activity.distance, activity.moving_time);
          content +=airMessage;
        }
        content += "\n\n"+poem;

        await service.updateActivity(title,content,event.object_id,tokenObject.access_token)
      }
     
      ctx.status = 200;
    } catch (err) {
      ctx.body = err;
    }
  }
};
