var qwerty=[" ","!","@","#","$","%","^","&","*","(",")","_","+","1","2","3","4","5","6","7","8","9","0","-","=","q","w","e","r","t","y","u","i","o","p","{","[","}","]","Q","W","E","R","T","Y","U","I","O","P","a","s","d","f","g","h","j","k","l",":",";",'"',"'","|","\\","A","S","D","F","G","H","J","K","L",">","<","z","x","c","v","b","n","M","m","<",",",">",".","?","/","Z","X","C","V","B","N"
]



var azerty=[" ","1","2","3","4","5","6","7","8","9","0","°","+","&","é",'"',"'","(","-","è","_","ç","à",")","=","a","z","e","r","t","y","u","i","o","p","¨","^","£","$","A","Z","E","R","T","Y","U","I","O","P","q","s","d","f","g","h","j","k","l","M","m","%","ù","µ","*","Q","S","D","F","G","H","J","K","L",">","<","w","x","c","v","b","n","?",",",".",";","/",":","§","!","W","X","C","V","B","N"
]

	function azerty_to_qwerty(caractere){
		switch(caractere.charCodeAt(0))
		{
			case 35: // #
				return "3";
				break;
			case 123:
				return "¨";
				break;
			case 91:
				return "^";
				break
			case 124:
				return "µ";
				break
			case 96:
				return "²";
				break;
			case 92: // \
				return "*";
				break;
			case 94:
				return "6";
				break;
			case 64:
				return "2";
				break;
			case 93:
				return "$";
				break;
			case 125:
				return "£";
				break;
		}
		position = azerty.indexOf(caractere);
		return qwerty[position];
	}
	function qwerty_to_azerty(caractere)
	{
		switch(caractere.charCodeAt(0))
		{
			case 123:
				return "¨";
				break;
		}
		position = qwerty.indexOf(caractere);
		return azerty[position];
	}

	function check_azerty(){
		texte_azerty=$("#azerty").val().split("");
		res="";
		for(letter in texte_azerty)
		{
			res+=azerty_to_qwerty(texte_azerty[letter]);
		}
		$("#qwerty").val(res);
	}

	function check_qwerty(){
		texte_qwerty=$("#qwerty").val().split("");
		res="";
		for(letter in texte_qwerty)
		{
			res+=qwerty_to_azerty(texte_qwerty[letter]);
		}
		$("#azerty").val(res);
	}
