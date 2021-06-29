	function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
	}
	function a2hex(str) {
	  var arr = [];
	  for (var i = 0, l = str.length; i < l; i ++) {
	    var hex = Number(str.charCodeAt(i)).toString(16);
	    arr.push(hex);
	  }
	  return arr.join('');
	}

	var binary = {
	  toAscii: function(bin) {
	    return bin.replace(/\s*[01]{8}\s*/g, function(bin) {
	      return String.fromCharCode(parseInt(bin, 2))
	    })
	  },
	  toBinary: function(str, spaceSeparatedOctets) {
	    return str.replace(/[\s\S]/g, function(str) {
	      str = binary.zeroPad(str.charCodeAt().toString(2));
	      return !1 == spaceSeparatedOctets ? str : str + " "
	    })
	  },
	  zeroPad: function(num) {
	    return "00000000".slice(String(num).length) + num
	  }
	};

	function a2d(chaine)
	{
		//str = string.split("");
		res="";
		for (var i = 0; i <chaine.length; i++) {
			res+=chaine.charCodeAt(i).toString();
			res+=" ";

		};
		return res;
	}
	function d2a(chaine)
	{
		str=chaine.replace(" ",",");
		return string.fromCharCode(str);
	}

	function encode()
	{
		plain_text=$("#plain_text").val();
		$("#base64").html(btoa(plain_text));
		$("#binary").html(binary.toBinary(plain_text));
		$("#hexadecimal").html(a2hex(plain_text));
		$("#decimal").html(a2d(plain_text));
	}

	function decode(source)
	{
		if(source=="base64")
		{
			plain_text=$("#base64").val();
			$("#plain_text").html(atob(plain_text));
			encode();
		}
		if(source=="binaire")
		{
			plain_text=$("#binary").val();
			$("#plain_text").html(binary.toAscii(plain_text));
			encode();
		}
		if(source=="hexadecimal")
		{
			plain_text=$("#hexadecimal").val();
			$("#plain_text").html(hex2a(plain_text));
			encode();
		}
		if(source=="decimal")
		{
			plain_text=$("#decimal").val();
			$("#plain_text").html(d2a(plain_text));
			encode();
		}
	}