/**
 * strava-webhook service
 */

import axios from 'axios';
import FormData from "form-data";
const jsdom = require("jsdom");

export default {
    getTokenObj: async (event) => {
        let tokenObj = {}
        try {
            if (event && event.aspect_type == 'create' && event.object_type == 'activity') {
                let userId = event.owner_id;
                let stravaUser = await strapi.db.query('api::strava-user.strava-user').findOne({ where: { strava_id: userId } });
                const stravaConfig = await strapi.entityService.findOne('api::strava-config.strava-config', 1);
                if (stravaUser && stravaConfig) {
                    try {
                        let response = await axios({
                            method: "post",
                            url: "https://www.strava.com/api/v3/oauth/token",
                            data: {
                                client_id: stravaConfig.client_id,
                                client_secret: stravaConfig.client_secret,
                                refresh_token: stravaUser.refresh_token,
                                grant_type: 'refresh_token'
                            }
                        });
                        tokenObj = response.data;
                        await strapi.entityService.update('api::strava-user.strava-user', stravaUser.id, {
                            data: {
                                access_token: response.data.access_token,
                                refresh_token: response.data.refresh_token
                            },
                        });
                    } catch (err) {
                        console.log(err)
                    }

                }
            }

            // return the reduced data
            return tokenObj;
        } catch (err) {
            return err;
        }
    },
    getActivity: async (activityId, accessToken) =>{
        let activity:any = {};
        try {
            let response = await axios.get(`https://www.strava.com/api/v3/activities/`+ activityId,{headers: { "Authorization": "Bearer " + accessToken }});
            activity = response.data;
        }catch(err){
            console.log(err)
        }
        return activity;
    },
    generatePoem: async (poemType, poemSubject, theload="tho", fullbaitho="Thêm một khổ", order = "0") => {
        let poem = "";
        var formData = new FormData();
        formData.append('theloai', theload);
        formData.append('poemSubject', poemSubject);
        formData.append('poemType', poemType);
        formData.append('fullbaitho', fullbaitho);
        formData.append('order', order);
        let htmlData = await axios({
            method: "post",
            url: "http://thomay.vn/thomay/index.php?q=tungcau",
            data: formData,
            headers: { "Content-Type": "multipart/form-data" },
        });
        const doc = new jsdom.JSDOM(htmlData.data);
        let result = doc.window.document.querySelectorAll('.contain-2 .paragraph')[0].innerHTML.replace(/<br\s*\/?>/mg, "\n");
        result = result.replace(/<[^>]*>?/gm, '');
        result = result.replace(/&nbsp;/g, '');
        result = result + '- thơ được làm bởi bot AI';
        poem = result;
        return poem;
    },
    getTitle: (distance, startDateLocal, stringFormat) => {
        let time = "";
        var today = new Date(startDateLocal)
        var curHr = today.getHours()
        if (curHr < 10) {
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
        distance = Math.floor(distance / 1000);
        stringFormat = stringFormat.replace('{{distance}}', distance);
        stringFormat = stringFormat.replace('{{time}}', time);
        return stringFormat;
    },
    updateActivity: async (title, content, activityId, accessToken) => {
        try {
            await axios({
                method: "put",
                url: "https://www.strava.com/api/v3/activities/" + activityId,
                headers: { "Authorization": "Bearer " + accessToken },
                data: {
                    name: title,
                    description: content
                }
            });
        }
        catch (err) {
            console.log(err)
        }
    },
    getAirQuality:async(lat, long, distance, movingTime) =>{
        console.log(lat, long)
        let airMessage = ""
        try {
            let response = await axios.get(`http://api.airvisual.com/v2/nearest_city/`,
            {params: { lat:lat, lon:long, key:'00d39b82-1b8c-48bf-93d3-ec9eacc25f31'}});
            let weatherData = response.data.data;
            let aqius = weatherData.current.pollution.aqius;
            let weather = weatherData.current.weather;
            let minutes = Math.floor(movingTime/60) + " phút";
           

            switch(true){
                case aqius<50: {
                    airMessage = "Chất lượng không khí: 🟢 Tốt - "+aqius+" USAQI";
                    airMessage += ", ";
                    airMessage += "phù hợp cho tempo run hoặc long run 🏃."; 
                    break;
                }
                case (aqius<100): {
                    airMessage = "Chất lượng không khí: 🟡 Trung bình - "+aqius+" USAQI";
                    airMessage += ", ";
                    airMessage += "phù hợp easy run dưới 2 giờ."
                    break;
                }
                case aqius<150: {
                    airMessage = "Chất lượng không khí: 🟠 Không lành mạnh cho người nhạy cảm - "+aqius+" USAQI";
                    airMessage += ", ";
                    airMessage += "chỉ phù hợp easy run dưới 1 giờ."
                    break;
                }
                case aqius<200: {
                    airMessage = "Chất lượng không khí: 🔴 Đếch an toàn - "+aqius+" USAQI";
                    airMessage += ", ";
                    airMessage += "chúc mừng bạn đã hít quá nhiều bụi mịn PM2.5 trong suốt "+minutes+" 🙃."
                    break;
                }
                case aqius<250: {
                    airMessage = "Chất lượng không khí: 🟣 Rất không an toàn - "+aqius+" USAQI";
                    airMessage += ", ";
                    airMessage += "chúc mừng bạn đã hít quá nhiều bụi mịn PM2.5 trong suốt "+minutes+" 🙃."
                    break;
                }
                case aqius<500: {
                    airMessage = "Chất lượng không khí: ⚫ Nguy hiểm - "+aqius+" USAQI";
                    airMessage += ", ";
                    airMessage += "chúc mừng bạn đã hít quá nhiều bụi mịn PM2.5 trong suốt "+minutes+" 🙃."
                }
            }
            airMessage+="\nNhiệt độ "+ weather.tp+"°C, độ ẩm "+weather.hu+"%, sức gió "+Math.round(weather.ws*3.6)+"km/h."
            console.log("airMessage",airMessage)
            console.log("weather",weather)
            
        }catch(err){
            console.log(err)
        }
        return airMessage;
    }

};
