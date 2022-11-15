
//conexion para la base de las incidencias, se migra a esta

const {createPool} = require('mysql');

const base323 = createPool ({
    
     host: '10.160.36.145',
     user: 'root',
     password: 'ccsW3ll4862',
     database: 'correos555',
     port: 3306,
});

module.exports = {
    //read :
    select : function(sql){
        return new Promise( (resolve,reject)=>{
            base323.query( sql, (err,rows) => {
                if(err){
                return reject(0)
                }
                resolve(rows)
            })
            base323.end
        })
    },
    //delete,insert update (deInUp) :
    deInUp : function(sql){
        return new Promise((resolve, reject)=>{
            base323.query(sql,(err, result)=>{
                if(err){
                return reject(0)
                }
                resolve(result.affectedRows)
            })
        base323.end
        })
    },
}