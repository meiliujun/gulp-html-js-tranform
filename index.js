/*
 * Author : meiliujun@126.com
 * Date : 2017-09-20
 */
var through = require('through2');
var gutil = require('gulp-util');
var fs = require('fs');
var path = require('path');
	
module.exports = function(options) {
	
	return through.obj(function(file, enc, cb){
	    if(file.isBuffer()){
        	var html = file.contents.toString();
        	html = removeEnter(html);
        	
        	//解析html中的运行参数
        	var param = html.match(/<!-- *tranform.+?endtranform *-->/g);
			
			if ( param ){			
				param = param.map(function(v){
					var tmp = v.split(/<!-- *tranform:(.*?)\((.*?)\) *-->/g);
					return {
						method: tmp[1] || '',
						data: tmp[2] || '',
						html : v.replace(/<\/*(!--|tpl).*?>/g, ''),
					};
				});
				
				//处理htmltojs方法的数据
				htmltojs(param, file);	
			}
			else{
				
			}
	    	
	    	cb();
	    }
	    else{
	        cb(null, file);
	    }
	});
};

function htmltojs(param, file){
	var html = file.contents.toString();
	var tpl = removeEnter(html);
    //tpl = tpl.replace(/\"/g,"\\\"")
	tpl = tpl.replace(/\'/g,"\\'");
	tpl = tpl.trim();
    
	var dir = path.dirname(file.path);
	var arr = tpl.match(/<script( \w+=['"][^'"]+['"])* src=['"](?!(http(s)*:|\/{2}))[^'"]+/g);
	arr.forEach(function(v){
		var f = path.normalize(dir + v.replace(/.+?src="/, '/'));
    	var jsfile = fs.readFileSync(f, 'utf-8');
    	
    	param.forEach(function(d){
    		if( d.method === 'htmltojs' ){
        		//替换js内容
    			jsfile = jsfile.replace(d.data, "'"+d.html.replace(/\'/g,"\\'")+"'");    			
    		}
    	});
    	fs.writeFileSync(f, jsfile);
	});	
	//替换html内容
	html = html.replace(/<!-- *tranform:[\s\S]+?endtranform *-->/g, '');
	fs.writeFileSync( file.path, html);
	
    gutil.log('Finished:', file.path)    
}

function removeEnter(content){
    var lines = content.split(/[\r\n]/g)
    var result = []
    for(var i=0,l=lines.length; i<l; i++){
        result.push(lines[i].trim())
    }
    return result.join('')
}
