const {createPool} = require('mysql');

const pool210  = createPool({
    host     : '10.160.36.210',
    user     : 'root',
    password : 'ccsPortales2015',
    database : 'correos555',
    port: 3306,
    charset : 'utf8mb4'
})

module.exports = {

  //read :
  select : function(sql){
    return new Promise( (resolve,reject)=>{
      pool210.query(sql,(err,rows)=>{
        if(err){
          return reject(0)
        }
        resolve(rows)
      })
      pool210.end
    })
  },

  //delete,insert update, :
  update : function(sql){
    return new Promise((resolve, reject)=>{
      pool210.query(sql,(err, result)=>{
        if(err){
          console.log(err);
          return reject(0)
        }
        resolve(result.affectedRows)
      })
      pool210.end
    })
  },

  //getlasId : using insert:
  lastIdInsert : function(sql){
    return new Promise((resolve, reject)=>{
      pool210.query(sql,(err, result)=>{
        if(err){
          return reject(0)
        }
        resolve(result.insertId)
      })
      pool210.end
    })
  }

}
