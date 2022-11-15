const {createPool} = require('mysql');

const pool23  = createPool({
    host     : '10.160.36.145',
    user     : 'root',
    password : 'ccsW3ll4862',
    database : 'correos555',
    port: 3306
})

module.exports = {

  //read :
  select : function(sql){
    return new Promise( (resolve,reject)=>{
      pool23.query(sql,(err,rows)=>{
        if(err){
          return reject(0)
        }
        resolve(rows)
      })
      pool23.end
    })
  },

  //delete,insert update, :
  update : function(sql){
    return new Promise((resolve, reject)=>{
      pool23.query(sql,(err, result)=>{
        if(err){
          console.log(err)
          return reject(0)
        }
        resolve(result.affectedRows)
      })
      pool23.end
    })
  },

  //getlasId : using insert:
  lastIdInsert : function(sql){
    return new Promise((resolve, reject)=>{
      pool23.query(sql,(err, result)=>{
        if(err){
          return reject(0)
        }
        resolve(result.insertId)
      })
      pool23.end
    })
  }

}
