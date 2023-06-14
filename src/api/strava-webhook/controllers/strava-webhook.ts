/**
 * A set of functions called "actions" for `strava-webhook`
 */
import FormData from "form-data";
const axios = require('axios');
const jsdom = require("jsdom");

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
      if (event && event.aspect_type == 'create' && event.object_type == 'activity') {
        let activityId = event.object_id;
        let userId = event.owner_id;
        let stravaUser = await strapi.db.query('api::strava-user.strava-user').findOne({
          where: {
            strava_id: userId
          }
        });
        const stravaConfig = await strapi.entityService.findOne('api::strava-config.strava-config', 1,);

        if(stravaUser && stravaConfig){
          axios({
            method: "post",
            url: "https://www.strava.com/api/v3/oauth/token",
            data: {
              client_id: stravaConfig.client_id,
              client_secret: stravaConfig.client_secret,
              refresh_token: stravaUser.refresh_token,
              grant_type: 'refresh_token'
            }
          })
            .then(async function (response) {
              console.log("token info..>>..",response.data)
              let access_token = response.data.access_token;
              //update strava user
              await strapi.entityService.update('api::strava-user.strava-user', stravaUser.id, {
                data: {
                  access_token: access_token,
                  refresh_token: response.data.refresh_token
                },
              });
              var formData = new FormData();
              formData.append('theloai', "tho");
              formData.append('poemSubject', "amthuc.dat");
              formData.append('poemType', "Bốn chữ (vè)");
              formData.append('fullbaitho', "Thêm một khổ");
              formData.append('order', '0');
              axios({
                method: "post",
                url: "http://thomay.vn/thomay/index.php?q=tungcau",
                data: formData,
                headers: { "Content-Type": "multipart/form-data" },
              })
                .then(async function (data) {
                  //handle success;
                  const doc = new jsdom.JSDOM(data.data);
                  let result = doc.window.document.querySelectorAll('.contain-2 .paragraph')[0].innerHTML.replace(/<br\s*\/?>/mg, "\n");
                  result = result.replace(/<[^>]*>?/gm, '');
                  result = result.replace(/&nbsp;/g, '');
                  result = result + '- thơ được làm bởi bot AI';
                  console.log(result);

                  let time = "";
                  var today = new Date()
                  var curHr = today.getHours()
                  if (curHr < 12) {
                    time = "sáng"
                  } else if (curHr < 15) {
                    time = "trưa"
                  } else if (curHr < 18) {
                    time = "chiều"
                  } else if (curHr < 22) {
                    time = "tối"
                  } else {
                    time = "khuya"
                  }

                  let activity = await axios.get(
                    `https://www.strava.com/api/v3/activities/`+ activityId,{headers: { "Authorization": "Bearer " + access_token },
                    }
                  );
                 
                  let distance = Math.floor(activity.data.distance/1000);

                  axios({
                    method: "put",
                    url: "https://www.strava.com/api/v3/activities/" + activityId,
                    headers: { "Authorization": "Bearer " + access_token },
                    data: {
                      name: "ăn "+time+" "+distance+" que!",
                      description: result
                    }
                  }).then(function (data) {
                    ctx.body = result;
                    ctx.status = 200;
                  }).catch(function (response) {
                    //handle error
                    console.log(response)
                  });
                })
                .catch(function (response) {
                  //handle error
                });
            }).catch(function (response) {
              //console.log("error when get auth==>", response)
            });
        }
        

      }
      ctx.status = 200;
    } catch (err) {
      //ctx.body = err;
    }
  }
};
