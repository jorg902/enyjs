const {createPool} = require('mysql');

const pool208  = createPool({
    host     : '10.160.36.208',
    user     : 'root',
    password : 'ccsWeb3',
    database : `111`,
    port: 3306
})

module.exports = {

  //read :
  select : function(sql){
    return new Promise( (resolve,reject)=>{
      pool208.query(sql,(err,rows)=>{
        if(err){
          return reject(0)
        }
        resolve(rows)
      })
      pool208.end
    })
  },

  //delete,insert update, :
  update : function(sql){
    return new Promise((resolve, reject)=>{
      pool208.query(sql,(err, result)=>{
        if(err){
          return reject(0)
        }
        resolve(result.affectedRows)
      })
      pool208.end
    })
  },

  //getlasId : using insert:
  lastIdInsert : function(sql){
    return new Promise((resolve, reject)=>{
      pool208.query(sql,(err, result)=>{
        if(err){
          return reject(0)
        }
        resolve(result.insertId)
      })
      pool208.end
    })
  }

}
