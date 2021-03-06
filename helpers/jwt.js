const expressJwt = require('express-jwt');

function authJwt() {
    const secret = process.env.secret;
    const api = process.env.API_URL;
    return expressJwt(
        {
            secret,
            algorithms: ['HS256'],
           // isRevoked: isRevoked                   // it is used to revoke token if user dont have specifc role .... isAdmin
        }
    ).unless({                    // use it to exclude specific APIs for authentication....e.g login 
        path: [
            {url: /\/Public\/uploads(.*)/ , methods: ['GET' , 'OPTIONS'] },
            {url: /\/api\/v1\/products(.*)/ , methods: ['GET' , 'OPTIONS'] },   //regular expression
            {url: /\/api\/v1\/categories(.*)/ , methods: ['GET' , 'OPTIONS'] },
            `${api}/users/login`,
            `${api}/users/register`,


        ]
    })
}

async function isRevoked(req , payload , done)
{
    if(!payload.isAdmin)
    { 
       done(null , true)
    }

    done();
}


module.exports = authJwt;