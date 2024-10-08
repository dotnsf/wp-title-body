//. readitems.js
var Mysql = require( 'mysql' );

//. env values
require( 'dotenv').config();
var database_url = 'DATABASE_URL' in process.env ? process.env.DATABASE_URL : ''; 
var db_limit = 'DB_LIMIT' in process.env ? parseInt( process.env.DB_LIMIT ) : 0; 
var db_offset = 'DB_OFFSET' in process.env ? parseInt( process.env.DB_OFFSET ) : 0; 

var mysql = Mysql.createPool( database_url );
mysql.on( 'error', function( err ){
  console.log( 'error on working', err );
});

//. Read Items
readItems = async function( limit, offset ){
  return new Promise( async ( resolve, reject ) => {
    if( mysql ){
      mysql.getConnection( function( err, conn ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          try{
            var sql = "select wp_posts.post_title as title, wp_posts.post_content as content, wp_terms.name as category, wp_posts.post_status as status"
            + " from wp_posts, wp_terms, wp_term_relationships"
            + " where wp_posts.post_type = 'post' "
            + " and ( wp_posts.post_status = 'publish' or wp_posts.post_status = 'draft' )"
            + " and wp_posts.ID = wp_term_relationships.object_id"
            + " and wp_term_relationships.term_taxonomy_id = wp_terms.term_id";

            if( limit ){
              if( offset ){
                sql += ' limit ' + offset + ',' + limit;
              }else{
                sql += ' limit ' + limit;
              }
            }

            conn.query( sql, function( err, results ){
              if( err ){
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                resolve( { status: true, results: results } );
              }
            });
          }catch( e ){
            console.log( e );
            resolve( { status: false, error: err } );
          }finally{
            conn.release();
          }
        }
      });
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

readItems( db_limit, db_offset ).then( function( r ){
  if( r && r.status ){
    console.log( JSON.stringify( r.results, null, 2 ) );
  }else{
    console.log( "error", r.error );
  }
  process.exit( 0 );
});

