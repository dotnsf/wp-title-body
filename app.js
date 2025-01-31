//. app.js
var express = require( 'express' ),
    app = express();

app.use( express.Router() );

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

//. Remove HTML tags
textify = function( html ){
  var text = html;
  if( text ){
    //. 改行コード
    text = text.split( "\n" ).join( "" );
    
    //. HTML コメント
    var n1 = text.indexOf( "<!--" );
    while( n1 > -1 ){
      var n2 = text.indexOf( "-->", n1 + 4 );
      if( n2 > n1 ){
        var t1 = text.substring( 0, n1 );
        var t2 = text.substring( n2 + 3 );
        text = t1 + t2;
      }else{
        n1 ++;
      }

      n1 = text.indexOf( "<!--", n1 );
    }

    //. HTML タグ
    n1 = text.indexOf( "<" );
    while( n1 > -1 ){
      var n2 = text.indexOf( ">", n1 + 1 );
      if( n2 > n1 ){
        var t1 = text.substring( 0, n1 );
        var t2 = text.substring( n2 + 1 );
        text = t1 + t2;
      }else{
        n1 ++;
      }

      n1 = text.indexOf( "<", n1 );
    }
  }

  return text;
}

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
                //. textify
                if( results && results.length ){
                  for( var i = 0; i < results.length; i ++ ){
                    results[i].content = textify( results[i].content );
                  }
                }
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


app.get( '/', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var r = await readItems( db_limit, db_offset );
  res.write( JSON.stringify( r, null, 2 ) );
  res.end();
});

var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
