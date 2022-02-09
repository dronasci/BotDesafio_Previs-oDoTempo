// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
//'use strict';

const functions = require('firebase-functions');
const {
  WebhookClient
} = require('dialogflow-fulfillment');
const {
  Card,
  Suggestion
} = require('dialogflow-fulfillment');
const axios = require('axios'); // adicionada a chama axios

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({
    request,
    response
  });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  
  function prevConsulta(agent) { // função chamada pela intent Consulta

    const local = agent.parameters.local; // grava o valor da variavel local originada na intent e que recebeu a resposta do cliente na variavel local
    const city = local.normalize('NFD').replace(/[\u0300-\u036f]/g, ""); // faço a remoção de acentos e simbolos caso possua para não dar erro na api
    const API_KEY = ''; // key de autorização
    const consLon = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`; // url da api com as variaveis necessárias para localizar a origem

    return axios.get(consLon) // chamada da api
      .then((result) => {
        const lat = result.data.coord.lat; // latitude retornada pelo response da api
        const lon = result.data.coord.lon; //longitude retornada pelo response da api
        const consTemp = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&lang=pt_br&units=metric&appid=${API_KEY}`; // url da api com as lat e lon para localizar a origem com forecast

        return axios.get(consTemp) // chamada da api
          .then((result) => {
            const dt1 = new Date(result.data.daily[0].dt * 1000).toISOString().slice(0, 10).substr(0, 10).split('-').reverse().join('/'); // data do primeiro dia no response
            const dt2 = new Date(result.data.daily[1].dt * 1000).toISOString().slice(0, 10).substr(0, 10).split('-').reverse().join('/'); // data do segundo dia no response
            const dt3 = new Date(result.data.daily[2].dt * 1000).toISOString().slice(0, 10).substr(0, 10).split('-').reverse().join('/'); // data do terceiro dia no response
            const dt4 = new Date(result.data.daily[3].dt * 1000).toISOString().slice(0, 10).substr(0, 10).split('-').reverse().join('/'); // data do quarto dia no response
            const dt5 = new Date(result.data.daily[4].dt * 1000).toISOString().slice(0, 10).substr(0, 10).split('-').reverse().join('/'); // data do quinto dia no response
            const dt6 = new Date(result.data.daily[5].dt * 1000).toISOString().slice(0, 10).substr(0, 10).split('-').reverse().join('/'); // data do sexto dia no response
            const dt7 = new Date(result.data.daily[6].dt * 1000).toISOString().slice(0, 10).substr(0, 10).split('-').reverse().join('/'); // data do setimo dia no response
            const ult = new Date(result.data.current.dt * 1000).toISOString().slice(0, 10).substr(0, 10).split('-').reverse().join('/') + ` às ` + new Date(result.data.current.dt * 1000).toISOString().slice(11, 19); // data e hora do dia atual no response
            // inicio da mensagem gerada com as variaveis de data

            agent.add(`A temperatura atual para ${local} é de ` + result.data.current.temp + `º - ` + result.data.current.weather[0].description); // a variavel local foi usada aqui para manter a original buscada
            agent.add(`Vou aproveitar e te deixar por dentro da previsão dos próximos 7 dias`);
            agent.add(dt1 + ` - ` + result.data.daily[0].temp.day + `º - ` + result.data.daily[0].weather[0].description + `\n\n` + // os valores referentes a temperatura e a descrição
              dt2 + ` - ` + result.data.daily[1].temp.day + `º - ` + result.data.daily[1].weather[0].description + `\n\n` +         // são daily[numero do indice do item no json].temp.day
              dt3 + ` - ` + result.data.daily[2].temp.day + `º - ` + result.data.daily[2].weather[0].description + `\n\n` +         // e daily[indice].weather[indice].description
              dt4 + ` - ` + result.data.daily[3].temp.day + `º - ` + result.data.daily[3].weather[0].description + `\n\n` +         // daily se refere ao dia, weather previsão e description ao estado do ceú na data selecioanda
              dt5 + ` - ` + result.data.daily[4].temp.day + `º - ` + result.data.daily[4].weather[0].description + `\n\n` +
              dt6 + ` - ` + result.data.daily[5].temp.day + `º - ` + result.data.daily[5].weather[0].description + `\n\n` +
              dt7 + ` - ` + result.data.daily[6].temp.day + `º - ` + result.data.daily[6].weather[0].description + `\n\n` +
              `\n\n\n** Última atualização em ${ult}`); // data da ultima atualização montada na variavél ult
            agent.add(`Gostaria de fazer outra consulta?`); // pergunta para acionar as intents anteriores ou a mesma

            //fim das mensagens

            // inicio do tratamento de erros da api onecall

          }).catch((err) => {
            if (err.response.status >= 500) {
              agent.add(`Peço desculpas, mas houve uma falha no sistema e já estou em busca da solução. Peço por gentileza que retorno em outro momento.`);
            }
            // fim do tratamento - só foram tratadas as acima de 500 porque para chegar até aqui o local buscado deve existir
          });
          // inicio do tratamento de erros da api weather
      }).catch((err) => {
        if (err.response.status >= 500) {
          agent.add(`Peço desculpas, mas houve uma falha no sistema e já estou em busca da solução. Peço por gentileza que retorne em outro momento.`);
        }// status 500 foi tratado, significa que houve falha na chamada da api
        if (err.response.status === 404) {
          agent.add(`Não consegui identificar o local informado. \n\n Verifique se o nome esta correto.\n\nCaso o erro persista é possivel que o local solicitado ainda não tenha entrado no meu cadastro. Vou anotar aqui para que nas próximas consultas esse erro não se repita.`);
          agent.add(`Para tentar novamente digite "Repetir" ou "Sair" para cancelar.`);
        }
        // 404 foi tratado como valor incorreto porque é o status que api retorna nesses casos
      }); // fim do tratamento de erros
  }


  let intentMap = new Map();
  intentMap.set('Consulta', prevConsulta);

  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
