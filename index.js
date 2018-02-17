const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const moment = require('moment')
//const db = require('./dbConnection')
const app = express()
const server = http.createServer(app)
const mysql = require('mysql2')
const sonar = require('./Services/SonarQube')
var con = mysql.createConnection({
  multipleStatements: true,
  host: "techforcedb.cxapu1enrlm4.us-east-2.rds.amazonaws.com",
  user: "hyddev",
  password: "Welcome123",
  database: "sonarqube"
});

app.use(cors())
app.use(bodyParser.json())

app.post('/sonar', (req, res, next) => {
  console.log(JSON.stringify(req.body, null, 2))
   res.end(JSON.stringify(req.body));
  res.status(200).end()
})
// app.get('/projects', function (req, res) {
//            con.query('SELECT * FROM projects', function (error, results, fields) {
//            if (error) throw error;
//            res.end(JSON.stringify(results));
//          });
// })
 // let projectInfo = moment("2018-02-15T12:35:39+0000").format("YYYY-MM-DD hh:mm:ss")
 // console.log(projectInfo);
app.post('/insertProjects', function (req, res) {
  let projectInfo = {}

        projectInfo['projectKey'] = req.body.taskId
        projectInfo['project_name'] = req.body.project.name
        projectInfo['createdBy'] = "admin"
        projectInfo['createdDate'] = moment(req.body.analysedAt).format("YYYY-MM-DD hh:mm:ss")
        projectInfo['lastUpdatedDate'] = moment(req.body.changedAt).format("YYYY-MM-DD hh:mm:ss")
        projectInfo['lastUpdatedBy'] = "admin"
        console.log("projectIII",projectInfo);
        let projectrecords = projectInfo
        let query = con.query('INSERT INTO projects SET ? ON DUPLICATE KEY UPDATE? ', [projectInfo,projectrecords] , function(err, result) {
         console.log(result);
        })
    })

app.post('/insertMetrics', function (req, res) {
  let metricInfo = {}
  con.query('SELECT projectId,project_name FROM projects',(err,result) =>{
    result.map((obj) =>{
    //  console.log(obj.projectId);
  if(obj.project_name == req.body.project.name){
    metricInfo['projectId'] = obj.projectId
    console.log(JSON.stringify(req.body, null , 2));
    let metrics = req.body.qualityGate.conditions

     metrics.map((obj) =>{
       obj.metric = obj.metric.replace('new_','')
      let value, name
      switch (obj.metric) {
        case 'coverage':
          return metricInfo['Coverage'] = `${obj.value}`
        case 'duplicated_lines_density':
         return metricInfo['Duplicated_lines'] = `${obj.value}`
        case 'security_rating':
        return metricInfo['Security'] = obj.value

        case 'maintainability_rating':
          let value = ''
          if (obj.value < 0.05) {
            value = 'A'
          } else if (obj.value < 0.1) {
            value = 'B'
          } else if (obj.value < 0.2) {
            value = 'C'
          } else if (obj.value < 0.5) {
            value = 'D'
          } else {
            value = 'E'
          }
          return metricInfo ['Maintainability'] = value
        case 'reliability_rating':
         return   metricInfo['Reliability'] = obj.value

      }
    })
    console.log("metricc",metricInfo);
    if (!metrics) {
        return res.status(400).send({ error:true, message: 'Please provide task' });
    }
    let metricrecords = metricInfo
    let sql = "INSERT INTO Metrics SET ? ON DUPLICATE KEY UPDATE? "

  let query = con.query(sql, [metricInfo,metricrecords] , function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        console.log("updated");
        return res.send({ error: false, data: results, message: 'New task has been created successfully.' });
        });
      }
    })
  })
});







server.listen(process.env.PORT || 8084, () => {
  console.log('server is up')
})
