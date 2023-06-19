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
       
  
        let activity = await service.getActivity(event.object_id, tokenObject.access_token);
        let stravaSettings = await strapi.db.query('api::strava-setting.strava-setting').findOne({ where: { strava_id: activity.athlete.id } });
        // console.log("getActivity>>>", activity);
        if(activity && stravaSettings){
          let name = activity.title;

          // update Title
          if(stravaSettings.has_update_title){
            name = service.getTitle(activity.distance, activity.start_date_local, stravaSettings.title_format);
            console.log("title>>>", name);
          }
          

          //add weahter
          if(stravaSettings.has_weather){
            let lat, lon:Number;
            if(activity.start_latlng && activity.start_latlng.length){
              lat = activity.start_latlng[0];
              lon = activity.start_latlng[1];
              let airMessage = await service.getAirQuality(lat,lon,activity.distance, activity.moving_time);
              content +=airMessage;
              content += "\n\n";
            }else if(stravaSettings.lat && stravaSettings.long){
              lat = stravaSettings.lat;
              lon = stravaSettings.lon;
              let airMessage = await service.getAirQuality(lat,lon,activity.distance, activity.moving_time);
              content +=airMessage;
              content += "\n\n";
            }
          }

         

          if(stravaSettings.has_poem){
            let poem = await service.generatePoem(stravaSettings.poem_type,stravaSettings.poem_subject);
            content+= poem
            // console.log("generatePoem>>>", poem);
          }
        
          await service.updateActivity(name,content,event.object_id,tokenObject.access_token)
        }
        
      }
     
      ctx.status = 200;
    } catch (err) {
      ctx.body = err;
    }
  }
};
