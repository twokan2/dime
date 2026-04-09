import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════
   DIME — Learn Conversational Spanish
   "dee-meh" — Talk to me.
   ═══════════════════════════════════════════════ */

const LEVELS = [
  { name: "Saludos", desc: "Greetings & Basics", dialect: "neutral", icon: "👋" },
  { name: "Ser y Estar", desc: "To Be (Both Ways)", dialect: "neutral", icon: "🪞" },
  { name: "La Comida", desc: "Food & Drink", dialect: "neutral", icon: "🍽️" },
  { name: "Los Números", desc: "Numbers & Counting", dialect: "neutral", icon: "🔢" },
  { name: "La Ciudad", desc: "Getting Around", dialect: "neutral", icon: "🏙️" },
  { name: "El Trabajo", desc: "Work & Daily Life", dialect: "neutral", icon: "💼" },
  { name: "El Tiempo", desc: "Weather & Time", dialect: "neutral", icon: "⛅" },
  { name: "La Familia", desc: "Family & People", dialect: "neutral", icon: "👨‍👩‍👧‍👦" },
  { name: "Verbos", desc: "Essential Verbs", dialect: "neutral", icon: "⚡" },
  { name: "Conversación", desc: "Real Conversations", dialect: "neutral", icon: "💬" },
  { name: "Boricua Basics", desc: "Caribbean Intro", dialect: "caribbean", icon: "🇵🇷" },
  { name: "Calle Style", desc: "Street Slang & Flow", dialect: "caribbean", icon: "🔥" },
];

const Q = {
  0: [
    { type:"translate",q:"Hello",a:"Hola",o:["Hola","Adiós","Gracias","Bueno"]},
    { type:"translate",q:"Good morning",a:"Buenos días",o:["Buenas noches","Buenos días","Buenas tardes","Hasta luego"]},
    { type:"translate",q:"How are you?",a:"¿Cómo estás?",o:["¿Cómo estás?","¿Qué hora es?","¿Dónde estás?","¿Quién eres?"]},
    { type:"fillblank",q:"Buenos _____, señor.",a:"días",o:["días","noche","hola","bien"]},
    { type:"translate",q:"Goodbye",a:"Adiós",o:["Hola","Gracias","Adiós","Por favor"]},
    { type:"scenario",q:"You walk into a shop at 3pm. What do you say?",a:"Buenas tardes",o:["Buenos días","Buenas tardes","Buenas noches","Hola, amigo"]},
    { type:"translate",q:"Thank you",a:"Gracias",o:["De nada","Por favor","Gracias","Lo siento"]},
    { type:"fillblank",q:"Mucho _____ en conocerte.",a:"gusto",o:["bien","gusto","hola","grande"]},
    { type:"translate",q:"Please",a:"Por favor",o:["Gracias","De nada","Lo siento","Por favor"]},
    { type:"scenario",q:"Someone says 'Gracias.' How do you respond?",a:"De nada",o:["Hola","Adiós","De nada","Buenos días"]},
    { type:"translate",q:"I'm sorry",a:"Lo siento",o:["Lo siento","Con permiso","De nada","Perdón"]},
    { type:"translate",q:"Excuse me",a:"Disculpe",o:["Gracias","Disculpe","Hola","Perdón"]},
    { type:"fillblank",q:"¿Cómo te _____?",a:"llamas",o:["llamas","estás","sientes","haces"]},
    { type:"scenario",q:"You bump into someone on the street:",a:"¡Perdón! Lo siento",o:["Hola, ¿cómo estás?","¡Perdón! Lo siento","Buenos días","Adiós"]},
    { type:"translate",q:"My name is...",a:"Me llamo...",o:["Yo soy...","Me llamo...","Tengo...","Estoy..."]},
    { type:"translate",q:"Nice to meet you",a:"Mucho gusto",o:["Buenas tardes","Mucho gusto","Hasta luego","Con permiso"]},
    { type:"fillblank",q:"Hasta _____, amigo.",a:"luego",o:["mañana","luego","pronto","bien"]},
    { type:"scenario",q:"It's 9pm. Greet your neighbor:",a:"Buenas noches",o:["Buenos días","Buenas tardes","Buenas noches","Hola, buenos"]},
    { type:"translate",q:"See you tomorrow",a:"Hasta mañana",o:["Hasta luego","Hasta mañana","Nos vemos","Buenas noches"]},
    { type:"fillblank",q:"Yo _____ bien, gracias.",a:"estoy",o:["soy","estoy","tengo","hago"]},
  ],
  1: [
    { type:"translate",q:"I am (permanent trait)",a:"Yo soy",o:["Yo soy","Yo estoy","Yo tengo","Yo voy"]},
    { type:"translate",q:"I am (temporary state)",a:"Yo estoy",o:["Yo soy","Yo estoy","Yo era","Yo fui"]},
    { type:"fillblank",q:"Yo _____ de Washington DC.",a:"soy",o:["estoy","soy","tengo","voy"]},
    { type:"fillblank",q:"Yo _____ cansado hoy.",a:"estoy",o:["soy","estoy","tengo","era"]},
    { type:"scenario",q:"Tell someone where you are FROM:",a:"Soy de DC",o:["Estoy en DC","Soy de DC","Voy a DC","Tengo DC"]},
    { type:"translate",q:"She is tall (permanent)",a:"Ella es alta",o:["Ella es alta","Ella está alta","Ella tiene alta","Ella va alta"]},
    { type:"fillblank",q:"Nosotros _____ en la oficina.",a:"estamos",o:["somos","estamos","tenemos","vamos"]},
    { type:"translate",q:"They are students",a:"Ellos son estudiantes",o:["Ellos están estudiantes","Ellos son estudiantes","Ellos tienen estudiantes","Ellos van estudiantes"]},
    { type:"fillblank",q:"La comida _____ deliciosa.",a:"está",o:["es","está","son","están"]},
    { type:"scenario",q:"Describe your mood right now:",a:"Estoy bien",o:["Soy bien","Estoy bien","Tengo bien","Hago bien"]},
    { type:"translate",q:"He is a doctor (profession)",a:"Él es doctor",o:["Él está doctor","Él es doctor","Él tiene doctor","Él va doctor"]},
    { type:"fillblank",q:"La fiesta _____ en mi casa.",a:"es",o:["es","está","son","hay"]},
    { type:"scenario",q:"Say the coffee is hot (temporary):",a:"El café está caliente",o:["El café es caliente","El café está caliente","El café tiene caliente","El café va caliente"]},
    { type:"translate",q:"We are happy (right now)",a:"Estamos contentos",o:["Somos contentos","Estamos contentos","Tenemos contentos","Vamos contentos"]},
    { type:"fillblank",q:"Ella _____ muy inteligente.",a:"es",o:["es","está","tiene","va"]},
    { type:"translate",q:"The door is open (state)",a:"La puerta está abierta",o:["La puerta es abierta","La puerta está abierta","La puerta tiene abierta","La puerta va abierta"]},
    { type:"scenario",q:"Say you are tired today:",a:"Hoy estoy cansado",o:["Hoy soy cansado","Hoy estoy cansado","Hoy tengo cansado","Hoy voy cansado"]},
    { type:"fillblank",q:"¿Dónde _____ el baño?",a:"está",o:["es","está","son","hay"]},
    { type:"translate",q:"You are very kind (trait)",a:"Eres muy amable",o:["Estás muy amable","Eres muy amable","Tienes muy amable","Vas muy amable"]},
    { type:"fillblank",q:"Yo _____ mexicano.",a:"soy",o:["soy","estoy","tengo","hago"]},
  ],
  2: [
    { type:"translate",q:"Water",a:"Agua",o:["Leche","Agua","Jugo","Café"]},
    { type:"translate",q:"Chicken",a:"Pollo",o:["Cerdo","Pescado","Pollo","Carne"]},
    { type:"fillblank",q:"Quiero un café con _____.",a:"leche",o:["agua","arroz","leche","pollo"]},
    { type:"scenario",q:"Ask for the check:",a:"La cuenta, por favor",o:["El menú, por favor","La cuenta, por favor","Más agua, por favor","La comida, por favor"]},
    { type:"translate",q:"I'm hungry",a:"Tengo hambre",o:["Estoy hambre","Soy hambre","Tengo hambre","Quiero hambre"]},
    { type:"translate",q:"Breakfast",a:"Desayuno",o:["Almuerzo","Cena","Desayuno","Merienda"]},
    { type:"fillblank",q:"Me gustaría _____ el pollo.",a:"ordenar",o:["comer","ordenar","beber","cocinar"]},
    { type:"scenario",q:"Order a coffee with milk:",a:"Un café con leche, por favor",o:["Quiero agua","Un café con leche, por favor","Dame arroz","Necesito pollo"]},
    { type:"translate",q:"Delicious",a:"Delicioso",o:["Caliente","Frío","Delicioso","Picante"]},
    { type:"translate",q:"Beer",a:"Cerveza",o:["Vino","Cerveza","Refresco","Jugo"]},
    { type:"fillblank",q:"La sopa está muy _____.",a:"caliente",o:["fría","caliente","grande","buena"]},
    { type:"translate",q:"I'm thirsty",a:"Tengo sed",o:["Tengo hambre","Tengo sed","Estoy sed","Quiero sed"]},
    { type:"scenario",q:"Ask what the waiter recommends:",a:"¿Qué me recomienda?",o:["¿Cuánto cuesta?","¿Qué me recomienda?","¿Dónde está el baño?","¿Tiene agua?"]},
    { type:"translate",q:"The menu",a:"El menú",o:["La carta","El menú","La cuenta","El plato"]},
    { type:"translate",q:"Spicy",a:"Picante",o:["Dulce","Salado","Picante","Amargo"]},
    { type:"scenario",q:"Tell the waiter you don't eat meat:",a:"No como carne",o:["No tengo hambre","No como carne","No quiero postre","No bebo alcohol"]},
    { type:"translate",q:"Dessert",a:"Postre",o:["Entrada","Postre","Plato","Bebida"]},
    { type:"translate",q:"Rice",a:"Arroz",o:["Pan","Arroz","Pollo","Carne"]},
    { type:"fillblank",q:"Quiero _____ más, por favor.",a:"pan",o:["pan","mesa","silla","cuenta"]},
    { type:"fillblank",q:"La _____ estuvo excelente.",a:"comida",o:["mesa","comida","cuenta","silla"]},
  ],
  3: [
    { type:"translate",q:"One",a:"Uno",o:["Uno","Dos","Tres","Diez"]},
    { type:"translate",q:"Twenty",a:"Veinte",o:["Doce","Quince","Veinte","Treinta"]},
    { type:"translate",q:"One hundred",a:"Cien",o:["Diez","Mil","Cien","Cincuenta"]},
    { type:"fillblank",q:"Tengo _____ años. (35)",a:"treinta y cinco",o:["veinticinco","treinta y cinco","cuarenta","quince"]},
    { type:"translate",q:"How much does it cost?",a:"¿Cuánto cuesta?",o:["¿Qué hora es?","¿Cuánto cuesta?","¿Dónde está?","¿Cuántos hay?"]},
    { type:"fillblank",q:"Son _____ dólares. ($50)",a:"cincuenta",o:["quince","cincuenta","quinientos","cinco"]},
    { type:"translate",q:"First",a:"Primero",o:["Segundo","Primero","Último","Tercero"]},
    { type:"scenario",q:"Say 'five, five, five':",a:"Cinco, cinco, cinco",o:["Tres, tres, tres","Cinco, cinco, cinco","Seis, seis, seis","Uno, uno, uno"]},
    { type:"translate",q:"Half",a:"Medio",o:["Todo","Medio","Doble","Poco"]},
    { type:"fillblank",q:"Necesito _____ minutos. (10)",a:"diez",o:["dos","cinco","diez","veinte"]},
    { type:"translate",q:"Fifteen",a:"Quince",o:["Cinco","Quince","Cincuenta","Quinientos"]},
    { type:"translate",q:"One thousand",a:"Mil",o:["Cien","Mil","Millón","Diez mil"]},
    { type:"fillblank",q:"Hay _____ personas aquí. (12)",a:"doce",o:["dos","diez","doce","veinte"]},
    { type:"scenario",q:"Ask how many people are in line:",a:"¿Cuántas personas hay en la fila?",o:["¿Dónde está la fila?","¿Cuántas personas hay en la fila?","¿Cuánto cuesta?","¿Quién es el último?"]},
    { type:"translate",q:"Forty",a:"Cuarenta",o:["Catorce","Cuarenta","Cuatrocientos","Cincuenta"]},
    { type:"translate",q:"Zero",a:"Cero",o:["Uno","Nada","Cero","Ninguno"]},
    { type:"scenario",q:"Tell a taxi: address number 1500:",a:"Número mil quinientos",o:["Número quince","Número ciento cincuenta","Número mil quinientos","Número quinientos"]},
    { type:"translate",q:"Third",a:"Tercero",o:["Primero","Segundo","Tercero","Cuarto"]},
    { type:"fillblank",q:"Somos _____ en el equipo. (6)",a:"seis",o:["tres","cinco","seis","siete"]},
    { type:"fillblank",q:"Mi dirección es el número _____. (200)",a:"doscientos",o:["veinte","doscientos","dos mil","doce"]},
  ],
  4: [
    { type:"translate",q:"Where is...?",a:"¿Dónde está...?",o:["¿Cómo está...?","¿Dónde está...?","¿Qué es...?","¿Cuándo es...?"]},
    { type:"translate",q:"Turn left",a:"Doble a la izquierda",o:["Siga derecho","Doble a la izquierda","Doble a la derecha","Pare aquí"]},
    { type:"fillblank",q:"El restaurante está a la _____.",a:"derecha",o:["arriba","abajo","derecha","lejos"]},
    { type:"scenario",q:"Ask where the metro is:",a:"Disculpe, ¿dónde está el metro?",o:["¿Qué hora es?","Disculpe, ¿dónde está el metro?","Quiero ir al parque","¿Cuánto cuesta?"]},
    { type:"translate",q:"Go straight",a:"Siga derecho",o:["Doble aquí","Siga derecho","Pare ahora","Vaya atrás"]},
    { type:"translate",q:"Near / Far",a:"Cerca / Lejos",o:["Grande / Pequeño","Cerca / Lejos","Arriba / Abajo","Aquí / Allá"]},
    { type:"fillblank",q:"_____ un taxi, por favor.",a:"Necesito",o:["Quiero","Necesito","Tengo","Soy"]},
    { type:"translate",q:"The store",a:"La tienda",o:["La casa","La tienda","La iglesia","La escuela"]},
    { type:"scenario",q:"Tell a taxi to stop here:",a:"Pare aquí, por favor",o:["Vamos rápido","Pare aquí, por favor","Siga derecho","Doble a la derecha"]},
    { type:"translate",q:"Street",a:"La calle",o:["El parque","La calle","El edificio","La plaza"]},
    { type:"fillblank",q:"¿_____ lejos de aquí?",a:"Está",o:["Es","Está","Hay","Tiene"]},
    { type:"translate",q:"Behind",a:"Detrás",o:["Delante","Detrás","Encima","Debajo"]},
    { type:"scenario",q:"Ask how far the airport is:",a:"¿Qué tan lejos está el aeropuerto?",o:["¿Dónde está el avión?","¿Qué tan lejos está el aeropuerto?","¿Cuánto cuesta el vuelo?","¿A qué hora sale?"]},
    { type:"translate",q:"Next to",a:"Al lado de",o:["Encima de","Al lado de","Debajo de","Lejos de"]},
    { type:"fillblank",q:"El banco está _____ de la farmacia.",a:"enfrente",o:["dentro","enfrente","encima","debajo"]},
    { type:"translate",q:"Corner",a:"La esquina",o:["La calle","La esquina","La cuadra","La avenida"]},
    { type:"scenario",q:"Ask someone to repeat directions:",a:"¿Puede repetir, por favor?",o:["Más despacio","¿Puede repetir, por favor?","No entiendo","Hable más alto"]},
    { type:"translate",q:"Block (city)",a:"La cuadra",o:["La calle","La cuadra","El barrio","La zona"]},
    { type:"fillblank",q:"Camine dos _____ más.",a:"cuadras",o:["calles","cuadras","metros","pasos"]},
    { type:"translate",q:"In front of",a:"Enfrente de",o:["Detrás de","Enfrente de","Al lado de","Lejos de"]},
  ],
  5: [
    { type:"translate",q:"I work in government",a:"Trabajo en el gobierno",o:["Trabajo en el gobierno","Estudio en la universidad","Vivo en la ciudad","Voy a la oficina"]},
    { type:"fillblank",q:"Soy _____ de programa.",a:"gerente",o:["doctor","gerente","profesor","abogado"]},
    { type:"translate",q:"Meeting",a:"Reunión",o:["Oficina","Reunión","Proyecto","Equipo"]},
    { type:"translate",q:"Team",a:"Equipo",o:["Grupo","Equipo","Jefe","Trabajo"]},
    { type:"scenario",q:"Introduce your job:",a:"Trabajo en el gobierno como gerente",o:["Soy estudiante","Trabajo en el gobierno como gerente","No tengo trabajo","Voy a la oficina"]},
    { type:"fillblank",q:"Tengo una _____ a las tres.",a:"reunión",o:["comida","reunión","fiesta","clase"]},
    { type:"translate",q:"Boss",a:"Jefe",o:["Amigo","Jefe","Compañero","Cliente"]},
    { type:"translate",q:"Project",a:"Proyecto",o:["Trabajo","Oficina","Proyecto","Problema"]},
    { type:"fillblank",q:"Mi _____ tiene diecinueve personas.",a:"equipo",o:["oficina","equipo","familia","clase"]},
    { type:"scenario",q:"Say you're busy:",a:"Estoy ocupado con el trabajo",o:["No tengo tiempo","Estoy ocupado con el trabajo","Voy a casa","Quiero descansar"]},
    { type:"translate",q:"Schedule",a:"Horario",o:["Calendario","Horario","Reloj","Tiempo"]},
    { type:"fillblank",q:"Necesito terminar este _____ hoy.",a:"proyecto",o:["reunión","proyecto","equipo","jefe"]},
    { type:"translate",q:"Email",a:"Correo electrónico",o:["Mensaje","Correo electrónico","Carta","Teléfono"]},
    { type:"scenario",q:"Ask what time the meeting is:",a:"¿A qué hora es la reunión?",o:["¿Dónde es la reunión?","¿A qué hora es la reunión?","¿Quién viene?","¿Por qué hay reunión?"]},
    { type:"translate",q:"Coworker",a:"Compañero de trabajo",o:["Amigo","Compañero de trabajo","Jefe","Empleado"]},
    { type:"fillblank",q:"Voy a _____ a las seis.",a:"salir",o:["comer","salir","dormir","llegar"]},
    { type:"translate",q:"Deadline",a:"Fecha límite",o:["Hora final","Fecha límite","Día último","Tiempo final"]},
    { type:"scenario",q:"Say you'll finish by Friday:",a:"Lo termino para el viernes",o:["Lo hago mañana","Lo termino para el viernes","No puedo hoy","Necesito más tiempo"]},
    { type:"translate",q:"Salary",a:"Salario",o:["Dinero","Salario","Pago","Cuenta"]},
    { type:"fillblank",q:"Trabajo de lunes a _____.",a:"viernes",o:["jueves","viernes","sábado","domingo"]},
  ],
  6: [
    { type:"translate",q:"What time is it?",a:"¿Qué hora es?",o:["¿Qué hora es?","¿Qué día es?","¿Cuándo es?","¿Cómo estás?"]},
    { type:"translate",q:"It's hot",a:"Hace calor",o:["Hace frío","Hace calor","Está lloviendo","Está nublado"]},
    { type:"fillblank",q:"Hoy es _____.",a:"martes",o:["enero","martes","verano","mañana"]},
    { type:"translate",q:"Tomorrow",a:"Mañana",o:["Ayer","Hoy","Mañana","Ahora"]},
    { type:"translate",q:"It's raining",a:"Está lloviendo",o:["Hace sol","Está lloviendo","Hace viento","Está nevando"]},
    { type:"fillblank",q:"Son las _____ de la tarde.",a:"tres",o:["dos","tres","cinco","una"]},
    { type:"scenario",q:"Tell someone it's cold today:",a:"Hoy hace frío",o:["Hoy hace calor","Hoy hace frío","Hoy es bonito","Hoy está bien"]},
    { type:"translate",q:"Week",a:"Semana",o:["Día","Mes","Semana","Año"]},
    { type:"translate",q:"Yesterday",a:"Ayer",o:["Hoy","Mañana","Ayer","Ahora"]},
    { type:"fillblank",q:"El _____ pasado fui al parque.",a:"domingo",o:["enero","verano","domingo","año"]},
    { type:"translate",q:"Spring",a:"Primavera",o:["Verano","Primavera","Otoño","Invierno"]},
    { type:"fillblank",q:"Hace mucho _____ afuera.",a:"viento",o:["sol","viento","agua","frío"]},
    { type:"scenario",q:"Ask if it will rain tomorrow:",a:"¿Va a llover mañana?",o:["¿Hace frío mañana?","¿Va a llover mañana?","¿Qué hora es?","¿Es verano?"]},
    { type:"translate",q:"Month",a:"Mes",o:["Día","Semana","Mes","Año"]},
    { type:"translate",q:"It's sunny",a:"Hace sol",o:["Hace calor","Hace sol","Está claro","Está bonito"]},
    { type:"fillblank",q:"En _____ hace mucho calor.",a:"verano",o:["invierno","verano","otoño","marzo"]},
    { type:"translate",q:"Cloudy",a:"Nublado",o:["Soleado","Nublado","Lluvioso","Ventoso"]},
    { type:"scenario",q:"Say the weather is nice:",a:"Hoy hace buen tiempo",o:["Hoy hace mal tiempo","Hoy hace buen tiempo","Está lloviendo","Hoy es frío"]},
    { type:"translate",q:"At night",a:"En la noche",o:["En la mañana","En la tarde","En la noche","Al mediodía"]},
    { type:"fillblank",q:"Los _____ no trabajo.",a:"sábados",o:["lunes","miércoles","viernes","sábados"]},
  ],
  7: [
    { type:"translate",q:"Mother",a:"Madre",o:["Padre","Madre","Hermana","Abuela"]},
    { type:"translate",q:"Brother",a:"Hermano",o:["Primo","Tío","Hermano","Hijo"]},
    { type:"fillblank",q:"Mi _____ tiene cuatro años.",a:"sobrino",o:["hermano","sobrino","abuelo","padre"]},
    { type:"translate",q:"Niece",a:"Sobrina",o:["Prima","Sobrina","Hija","Hermana"]},
    { type:"scenario",q:"Tell someone about your pets:",a:"Tengo dos perros",o:["Tengo un gato","Tengo dos perros","No tengo mascotas","Quiero un pájaro"]},
    { type:"translate",q:"Grandfather",a:"Abuelo",o:["Padre","Tío","Abuelo","Primo"]},
    { type:"translate",q:"Wife / Husband",a:"Esposa / Esposo",o:["Novia / Novio","Esposa / Esposo","Amiga / Amigo","Hermana / Hermano"]},
    { type:"translate",q:"Son / Daughter",a:"Hijo / Hija",o:["Primo / Prima","Hijo / Hija","Nieto / Nieta","Sobrino / Sobrina"]},
    { type:"scenario",q:"Say you have a big family:",a:"Tengo una familia grande",o:["Mi familia es pequeña","Tengo una familia grande","No tengo familia","Vivo solo"]},
    { type:"fillblank",q:"Mi _____ cocina muy bien.",a:"abuela",o:["perro","abuela","carro","casa"]},
    { type:"translate",q:"Cousin",a:"Primo",o:["Hermano","Primo","Tío","Sobrino"]},
    { type:"translate",q:"Uncle",a:"Tío",o:["Abuelo","Primo","Tío","Padre"]},
    { type:"fillblank",q:"Mis _____ viven en Texas.",a:"padres",o:["amigos","padres","perros","jefes"]},
    { type:"scenario",q:"Introduce your sister:",a:"Ella es mi hermana",o:["Ella es mi madre","Ella es mi hermana","Ella es mi prima","Ella es mi amiga"]},
    { type:"translate",q:"Grandchildren",a:"Nietos",o:["Hijos","Sobrinos","Nietos","Primos"]},
    { type:"fillblank",q:"Somos una familia muy _____.",a:"unida",o:["grande","unida","bonita","nueva"]},
    { type:"translate",q:"Girlfriend / Boyfriend",a:"Novia / Novio",o:["Esposa / Esposo","Novia / Novio","Amiga / Amigo","Mujer / Hombre"]},
    { type:"scenario",q:"Say your nephew loves trucks:",a:"A mi sobrino le encantan los camiones",o:["Mi sobrino es grande","A mi sobrino le encantan los camiones","Tiene cuatro años","Vive conmigo"]},
    { type:"translate",q:"Twins",a:"Gemelos",o:["Hermanos","Gemelos","Primos","Amigos"]},
    { type:"fillblank",q:"Mi _____ favorita es la de Navidad.",a:"tradición",o:["comida","tradición","fiesta","familia"]},
  ],
  8: [
    { type:"translate",q:"To go",a:"Ir",o:["Ser","Ir","Ver","Dar"]},
    { type:"translate",q:"To want",a:"Querer",o:["Poder","Querer","Deber","Saber"]},
    { type:"fillblank",q:"Yo _____ ir al restaurante.",a:"quiero",o:["tengo","quiero","puedo","debo"]},
    { type:"translate",q:"To know (a fact)",a:"Saber",o:["Conocer","Saber","Pensar","Creer"]},
    { type:"translate",q:"I can",a:"Yo puedo",o:["Yo quiero","Yo debo","Yo puedo","Yo sé"]},
    { type:"fillblank",q:"Nosotros _____ al parque los domingos.",a:"vamos",o:["somos","vamos","tenemos","hacemos"]},
    { type:"translate",q:"To do / To make",a:"Hacer",o:["Decir","Hacer","Poner","Tener"]},
    { type:"scenario",q:"Say 'I need to work':",a:"Necesito trabajar",o:["Quiero trabajar","Necesito trabajar","Puedo trabajar","Debo trabajar"]},
    { type:"fillblank",q:"¿Tú _____ dónde está el banco?",a:"sabes",o:["conoces","sabes","quieres","puedes"]},
    { type:"translate",q:"To speak",a:"Hablar",o:["Escuchar","Hablar","Leer","Escribir"]},
    { type:"translate",q:"To eat",a:"Comer",o:["Beber","Comer","Cocinar","Pedir"]},
    { type:"translate",q:"To sleep",a:"Dormir",o:["Descansar","Dormir","Soñar","Despertar"]},
    { type:"fillblank",q:"Ella _____ español muy bien.",a:"habla",o:["sabe","habla","tiene","conoce"]},
    { type:"scenario",q:"Say you don't understand:",a:"No entiendo",o:["No sé","No entiendo","No puedo","No quiero"]},
    { type:"translate",q:"To give",a:"Dar",o:["Tomar","Dar","Poner","Traer"]},
    { type:"fillblank",q:"¿_____ venir conmigo?",a:"Puedes",o:["Sabes","Puedes","Quieres","Debes"]},
    { type:"translate",q:"To leave",a:"Salir",o:["Entrar","Salir","Llegar","Volver"]},
    { type:"translate",q:"To bring",a:"Traer",o:["Llevar","Traer","Dar","Poner"]},
    { type:"scenario",q:"Ask for help:",a:"¿Me puedes ayudar?",o:["¿Me puedes dar?","¿Me puedes ayudar?","¿Me puedes decir?","¿Me puedes llevar?"]},
    { type:"fillblank",q:"Voy a _____ temprano mañana.",a:"salir",o:["dormir","salir","comer","trabajar"]},
  ],
  9: [
    { type:"scenario",q:"Meet someone new at a party:",a:"¡Hola! ¿Cómo te llamas?",o:["¡Adiós!","¡Hola! ¿Cómo te llamas?","¿Cuánto cuesta?","Tengo hambre"]},
    { type:"fillblank",q:"¿De dónde _____?",a:"eres",o:["estás","eres","tienes","vas"]},
    { type:"scenario",q:"Someone asks what you do:",a:"Trabajo en el gobierno. Soy gerente.",o:["No sé","Trabajo en el gobierno. Soy gerente.","Soy estudiante","No trabajo"]},
    { type:"translate",q:"I like it a lot",a:"Me gusta mucho",o:["Me gusta mucho","No me gusta","Me encanta","Está bien"]},
    { type:"fillblank",q:"¿_____ gustó la comida?",a:"Te",o:["Me","Te","Le","Se"]},
    { type:"scenario",q:"Find the bathroom:",a:"Disculpa, ¿dónde está el baño?",o:["Necesito agua","Disculpa, ¿dónde está el baño?","Quiero irme","Estoy cansado"]},
    { type:"translate",q:"See you later",a:"Nos vemos",o:["Adiós","Hasta luego","Nos vemos","Buenas noches"]},
    { type:"fillblank",q:"Fue un _____ conocerte.",a:"placer",o:["gusto","placer","bueno","grande"]},
    { type:"scenario",q:"Ask for their number:",a:"¿Me das tu número?",o:["¿Cómo te llamas?","¿Me das tu número?","¿Dónde vives?","¿Tienes carro?"]},
    { type:"translate",q:"Let's go!",a:"¡Vamos!",o:["¡Espera!","¡Vamos!","¡Para!","¡Corre!"]},
    { type:"scenario",q:"Say you're learning Spanish:",a:"Estoy aprendiendo español",o:["Hablo español","Estoy aprendiendo español","No hablo español","Sé un poco"]},
    { type:"fillblank",q:"¿Quieres ir a _____ algo?",a:"tomar",o:["hacer","tomar","ver","dar"]},
    { type:"translate",q:"What do you think?",a:"¿Qué piensas?",o:["¿Qué quieres?","¿Qué piensas?","¿Qué haces?","¿Qué dices?"]},
    { type:"scenario",q:"Compliment someone's cooking:",a:"¡Esto está delicioso!",o:["Está bien","¡Esto está delicioso!","Tengo hambre","Quiero más"]},
    { type:"translate",q:"I agree",a:"Estoy de acuerdo",o:["Yo creo que sí","Estoy de acuerdo","Tienes razón","Claro que sí"]},
    { type:"fillblank",q:"La pasé muy _____ anoche.",a:"bien",o:["mal","bien","grande","mucho"]},
    { type:"scenario",q:"Say goodbye after a great time:",a:"La pasé increíble, gracias.",o:["Adiós","La pasé increíble, gracias.","Buenas noches","Hasta mañana"]},
    { type:"translate",q:"Of course!",a:"¡Claro que sí!",o:["¡Tal vez!","¡Claro que sí!","¡No sé!","¡Quién sabe!"]},
    { type:"fillblank",q:"Vamos a _____ este fin de semana.",a:"salir",o:["trabajar","salir","dormir","estudiar"]},
    { type:"scenario",q:"Invite someone to hang out:",a:"¿Quieres salir este fin de semana?",o:["¿Tienes tiempo?","¿Quieres salir este fin de semana?","¿Vas a trabajar?","¿Dónde vives?"]},
  ],
  10: [
    { type:"translate",q:"What's up? (PR)",a:"¿Qué lo que?",o:["¿Cómo estás?","¿Qué tal?","¿Qué lo que?","¿Qué pasa?"]},
    { type:"translate",q:"Awesome! (PR)",a:"¡Wepa!",o:["¡Oye!","¡Wepa!","¡Mira!","¡Dale!"]},
    { type:"fillblank",q:"Esa canción está _____. (amazing)",a:"brutal",o:["buena","brutal","bonita","grande"]},
    { type:"translate",q:"Let's go (Caribbean)",a:"¡Dale!",o:["¡Vamos!","¡Dale!","¡Espera!","¡Corre!"]},
    { type:"scenario",q:"Friend shows you great food:",a:"¡Wepa! Eso se ve brutal, mano",o:["Está bueno","¡Wepa! Eso se ve brutal, mano","Quiero comer","Gracias"]},
    { type:"translate",q:"Dude / Bro (PR)",a:"Mano",o:["Amigo","Hermano","Mano","Señor"]},
    { type:"fillblank",q:"Estoy más cansao que un _____.",a:"perro",o:["gato","perro","niño","viejo"]},
    { type:"translate",q:"Don't mess with me (PR)",a:"No me jodas",o:["Déjame en paz","No me jodas","No me hables","Vete de aquí"]},
    { type:"scenario",q:"Greet your PR friend casually:",a:"¡Qué lo que, pana! ¿Cómo andas?",o:["Buenos días, señor","¡Qué lo que, pana! ¿Cómo andas?","Hola, ¿cómo estás?","¿Qué tal?"]},
    { type:"translate",q:"That's a mess (PR)",a:"¡Qué relajo!",o:["¡Qué problema!","¡Qué relajo!","¡Qué lío!","¡Qué horror!"]},
    { type:"fillblank",q:"Todo bien, gracias a _____.",a:"Dios",o:["ti","Dios","todos","mí"]},
    { type:"translate",q:"Buddy (PR)",a:"Pana",o:["Amigo","Pana","Mano","Compa"]},
    { type:"scenario",q:"React to surprising news PR style:",a:"¡No me digas! ¿De verdad?",o:["¿En serio?","¡No me digas! ¿De verdad?","Wow","Interesante"]},
    { type:"translate",q:"Everything chill",a:"Todo tranquilo",o:["Todo bien","Todo tranquilo","Todo bueno","Todo normal"]},
    { type:"fillblank",q:"Eso está bien _____.",a:"cabrón",o:["bueno","cabrón","loco","fuerte"]},
    { type:"translate",q:"The thing is...",a:"Es que...",o:["Mira...","Es que...","Bueno...","O sea..."]},
    { type:"scenario",q:"Party was amazing. Tell your friend:",a:"¡Mano, la fiesta estuvo brutal! ¡Wepa!",o:["Estuvo bien","¡Mano, la fiesta estuvo brutal! ¡Wepa!","Me gustó","Fue divertido"]},
    { type:"translate",q:"Dang! (PR)",a:"¡Diache!",o:["¡Caramba!","¡Diache!","¡Ay!","¡Oye!"]},
    { type:"fillblank",q:"Vamos a janguear este _____.",a:"fin de semana",o:["día","fin de semana","momento","rato"]},
    { type:"translate",q:"To hang out (PR)",a:"Janguear",o:["Salir","Janguear","Pasear","Caminar"]},
  ],
  11: [
    { type:"translate",q:"You're messing with me (PR)",a:"Me estás gufando",o:["Me estás mintiendo","Me estás gufando","Me estás molestando","Me estás hablando"]},
    { type:"fillblank",q:"Tengo _____ años esperando.",a:"mil",o:["diez","cien","mil","muchos"]},
    { type:"translate",q:"That song is a hit",a:"Esa canción está pegá",o:["Es buena","Esa canción está pegá","Me gusta","Es nueva"]},
    { type:"scenario",q:"Friend is late. React Caribbean:",a:"¡Mano, tengo mil años esperando!",o:["Llegas tarde","¡Mano, tengo mil años esperando!","No importa","Está bien"]},
    { type:"fillblank",q:"El tráfico estaba al _____.",a:"garete",o:["máximo","garete","fuego","diablo"]},
    { type:"translate",q:"Play that song (PR)",a:"Ponme esa canción",o:["Escucha esa canción","Ponme esa canción","Canta esa canción","Busca esa canción"]},
    { type:"translate",q:"Part of the crew",a:"Parte del corillo",o:["Parte del grupo","Parte del corillo","Parte del equipo","Parte del barrio"]},
    { type:"scenario",q:"Hype up friend's cooking:",a:"¡Diache! Cocinas con sazón",o:["Está bueno","¡Diache! Cocinas con sazón","Gracias","Me gusta"]},
    { type:"fillblank",q:"Mira el _____ que tiene este tipo.",a:"show",o:["problema","show","relajo","drama"]},
    { type:"translate",q:"Out of control (PR)",a:"Al garete",o:["Al máximo","Al garete","Al fuego","Al diablo"]},
    { type:"scenario",q:"Joke about your Spanish:",a:"Mi español es un desastre, pero aquí estamos",o:["Hablo bien","Mi español es un desastre, pero aquí estamos","No sé nada","Estoy aprendiendo"]},
    { type:"fillblank",q:"Bad Bunny es _____.",a:"brutal",o:["bueno","brutal","famoso","grande"]},
    { type:"translate",q:"Seasoning / Flavor",a:"Sazón",o:["Sal","Sazón","Sabor","Salsa"]},
    { type:"scenario",q:"Traffic was insane:",a:"¡El tráfico estaba al garete!",o:["Había tráfico","¡El tráfico estaba al garete!","Estaba mal","No pude llegar"]},
    { type:"fillblank",q:"¿Dónde tú _____ anoche?",a:"estabas",o:["eras","estabas","fuiste","ibas"]},
    { type:"translate",q:"I'm dying of hunger",a:"Me muero de hambre",o:["Tengo hambre","Me muero de hambre","Quiero comer","Necesito comida"]},
    { type:"translate",q:"Look at this spectacle!",a:"¡Mira el show!",o:["¡Mira esto!","¡Mira el show!","¡Mira allá!","¡Mira quién llegó!"]},
    { type:"scenario",q:"Confirm you're coming, PR style:",a:"¡Dale! Llego en un ratito",o:["Sí, voy","¡Dale! Llego en un ratito","Está bien","Voy para allá"]},
    { type:"fillblank",q:"Ahora eres parte del _____.",a:"corillo",o:["grupo","corillo","equipo","barrio"]},
    { type:"translate",q:"A little while",a:"Un ratito",o:["Un momento","Un ratito","Un segundo","Un rato"]},
  ],
};

// Speech
const speak = (t) => { try { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang='es-MX'; u.rate=0.85; const v = window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('es')); if(v) u.voice=v; window.speechSynthesis.speak(u); }} catch(e){} };

// Sound
const useSound = () => {
  const c = useRef(null);
  const g = () => { if(!c.current) c.current = new (window.AudioContext||window.webkitAudioContext)(); return c.current; };
  return (t) => { try { const x=g(),o=x.createOscillator(),gn=x.createGain(); o.connect(gn); gn.connect(x.destination);
    if(t==="ok"){o.frequency.setValueAtTime(523,x.currentTime);o.frequency.setValueAtTime(659,x.currentTime+.1);o.frequency.setValueAtTime(784,x.currentTime+.2);gn.gain.setValueAtTime(.1,x.currentTime);gn.gain.exponentialRampToValueAtTime(.01,x.currentTime+.4);o.start(x.currentTime);o.stop(x.currentTime+.4);}
    else if(t==="no"){o.frequency.setValueAtTime(200,x.currentTime);o.frequency.setValueAtTime(150,x.currentTime+.15);o.type="sawtooth";gn.gain.setValueAtTime(.07,x.currentTime);gn.gain.exponentialRampToValueAtTime(.01,x.currentTime+.3);o.start(x.currentTime);o.stop(x.currentTime+.3);}
    else if(t==="up"){[523,659,784,1047].forEach((f,i)=>{const oo=x.createOscillator(),gg=x.createGain();oo.connect(gg);gg.connect(x.destination);oo.frequency.setValueAtTime(f,x.currentTime+i*.12);gg.gain.setValueAtTime(.08,x.currentTime+i*.12);gg.gain.exponentialRampToValueAtTime(.01,x.currentTime+i*.12+.3);oo.start(x.currentTime+i*.12);oo.stop(x.currentTime+i*.12+.3);});}
  } catch(e){} };
};

// Storage
const SK="dime_v1";
const load=()=>{try{const s=localStorage.getItem(SK);if(s)return JSON.parse(s);}catch(e){}return{xp:0,streak:0,last:null,done:[],hi:{},tc:0,ta:0,sound:true};};
const save=(p)=>{try{localStorage.setItem(SK,JSON.stringify(p));}catch(e){}};

// ═══════════════ APP ═══════════════
export default function Dime() {
  const [scr, setScr] = useState("landing");
  const [prog, setProg] = useState(load);
  const [lvl, setLvl] = useState(0);
  const [qi, setQi] = useState(0);
  const [pts, setPts] = useState(0);
  const [sel, setSel] = useState(null);
  const [show, setShow] = useState(false);
  const [qs, setQs] = useState([]);
  const [cmb, setCmb] = useState(0);
  const [res, setRes] = useState([]);
  const [modal, setModal] = useState(null); // 'how'|'share'|null
  const [toast, setToast] = useState("");
  const snd = useSound();

  useEffect(()=>{save(prog);},[prog]);
  useEffect(()=>{
    if(prog.last){const d=Math.floor((new Date(new Date().toDateString())-new Date(prog.last))/864e5);if(d>1&&prog.streak>0)setProg(p=>({...p,streak:0}));}
    if(prog.xp>0&&scr==="landing")setScr("home");
  },[]);
  useEffect(()=>{if('speechSynthesis' in window)window.speechSynthesis.getVoices();},[]);

  const shuf=(a)=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=0|Math.random()*(i+1);[r[i],r[j]]=[r[j],r[i]];}return r;};

  const go=(l)=>{const d=Q[l];if(!d)return;setLvl(l);setQs(shuf(d).map(q=>({...q,options:shuf(q.o)})));setQi(0);setPts(0);setCmb(0);setSel(null);setShow(false);setRes([]);setScr("play");};

  const pick=(a)=>{
    if(show)return; const q=qs[qi]; const ok=a===q.a;
    setSel(a); setShow(true);
    if(ok){if(prog.sound)snd("ok");setPts(s=>s+10+Math.min(cmb,5)*2);setCmb(c=>c+1);}
    else{if(prog.sound)snd("no");setCmb(0);}
    setRes(r=>[...r,{ok,q:q.q,you:a,ans:q.a}]);
    setTimeout(()=>{
      if(qi+1<qs.length){setQi(i=>i+1);setSel(null);setShow(false);}
      else{const fs=ok?pts+10+Math.min(cmb,5)*2:pts;fin(fs);}
    },1400);
  };

  const fin=(fs)=>{
    if(prog.sound)snd("up");
    const today=new Date().toDateString();const wt=prog.last===today;
    const cc=res.filter(r=>r.ok).length+(sel===qs[qi]?.a?1:0);
    setProg(p=>({...p,xp:p.xp+fs,streak:wt?p.streak:p.streak+1,last:today,done:p.done.includes(lvl)?p.done:[...p.done,lvl],hi:{...p.hi,[lvl]:Math.max(p.hi[lvl]||0,fs)},tc:p.tc+cc,ta:p.ta+qs.length}));
    setPts(fs);setScr("results");
  };

  const unlk=(i)=>{if(i===0)return true;if(i<=9)return prog.done.includes(i-1);return prog.done.filter(l=>l<=9).length>=10;};
  const rank=()=>{if(prog.xp<100)return{l:1,t:"Principiante",n:100};if(prog.xp<300)return{l:2,t:"Estudiante",n:300};if(prog.xp<600)return{l:3,t:"Aprendiz",n:600};if(prog.xp<1000)return{l:4,t:"Hablante",n:1000};if(prog.xp<1500)return{l:5,t:"Conversador",n:1500};return{l:6,t:"Boricua Honorario 🇵🇷",n:null};};
  const r=rank(); const cq=qs[qi];

  const share=async()=>{
    const t=`I'm learning Spanish on Dime 🇪🇸\n\nLevel ${r.l} — ${r.t}\n${prog.xp} XP · ${prog.streak} day streak 🔥\n${prog.done.length}/${LEVELS.length} levels`;
    if(navigator.share){try{await navigator.share({title:'Dime',text:t});}catch(e){}}
    else{try{await navigator.clipboard.writeText(t);setToast("Copied!");setTimeout(()=>setToast(""),2e3);}catch(e){}}
  };

  // Colors
  const C = { bg: "#0B0B0F", card: "rgba(255,255,255,0.028)", border: "rgba(255,255,255,0.05)", gold: "#E8A838", amber: "#F59E0B", warm: "#FCD34D", cyan: "#06B6D4", red: "#EF4444", green: "#10B981", text: "#E5E2ED", sub: "rgba(255,255,255,0.35)", muted: "rgba(255,255,255,0.15)", accent: "#E8A838" };

  const Btn = ({children, primary, onClick, style:sx}) => (
    <button onClick={onClick} style={{ background: primary ? `linear-gradient(135deg, ${C.gold}, #D97706)` : C.card, border: primary ? "none" : `1px solid ${C.border}`, borderRadius: 12, padding: "14px 24px", fontSize: 15, fontWeight: 700, color: primary ? "#0B0B0F" : C.text, cursor: "pointer", fontFamily: "inherit", width: "100%", transition: "all 0.15s", letterSpacing: primary ? 0.5 : 0, ...sx }}>{children}</button>
  );

  return (
    <div style={{ minHeight:"100vh", background: C.bg, fontFamily:"'Instrument Sans', 'DM Sans', system-ui, sans-serif", color: C.text, position:"relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet"/>

      {/* Ambient */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle, rgba(232,168,56,0.04) 0%, transparent 60%)",top:"-20%",right:"-20%",filter:"blur(100px)"}}/>
        <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle, rgba(6,182,212,0.03) 0%, transparent 60%)",bottom:"10%",left:"-10%",filter:"blur(80px)"}}/>
      </div>

      {/* Toast */}
      {toast && <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:C.gold,color:"#000",padding:"10px 28px",borderRadius:100,fontSize:13,fontWeight:700,zIndex:999,letterSpacing:0.5}}>{toast}</div>}

      <div style={{position:"relative",zIndex:1,maxWidth:440,margin:"0 auto",padding:"0 24px"}}>

        {/* ═══ LANDING ═══ */}
        {scr==="landing"&&(
          <div style={{paddingTop:"28vh",textAlign:"center",paddingBottom:60}}>
            <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:80,fontWeight:900,margin:"0 0 4px",color:C.gold,letterSpacing:-3,lineHeight:1}}>dime</h1>
            <div style={{fontSize:13,color:C.sub,letterSpacing:3,fontWeight:600,marginBottom:40,fontStyle:"italic"}}>"dee-meh" — talk to me</div>
            <p style={{fontSize:15,color:C.sub,lineHeight:1.7,maxWidth:300,margin:"0 auto 44px"}}>Learn conversational Spanish. Start neutral. Unlock Caribbean.</p>
            <Btn primary onClick={()=>setScr("onboard")} style={{width:"auto",padding:"16px 52px",borderRadius:100,fontSize:16}}>Begin</Btn>
            <div style={{marginTop:20}}><button onClick={()=>setScr("home")} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>RETURNING PLAYER →</button></div>
          </div>
        )}

        {/* ═══ ONBOARD ═══ */}
        {scr==="onboard"&&(
          <div style={{paddingTop:52,paddingBottom:60}}>
            <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:32,fontWeight:800,marginBottom:32,color:C.gold}}>How it works</h2>
            {[
              {i:"01",t:"Real scenarios, not flashcards",d:"Translation, fill-in-the-blank, and real-world situations. You learn to actually speak."},
              {i:"02",t:"Start clean, go street",d:"Levels 1–10: neutral Latin American Spanish (Mexican/Colombian). Clear, slow, learnable. Levels 11–12: Caribbean/PR dialect unlocks after."},
              {i:"03",t:"Listen as you go",d:"Tap 🔊 on any correct answer to hear pronunciation. Train your ear while you play."},
              {i:"04",t:"Streaks reward consistency",d:"Daily streaks and combo multipliers. Chain correct answers for bonus points."},
            ].map((x,i)=>(
              <div key={i} style={{display:"flex",gap:20,marginBottom:28,alignItems:"flex-start"}}>
                <div style={{fontSize:11,fontWeight:700,color:C.gold,opacity:0.5,paddingTop:3,fontFamily:"'Playfair Display', serif",minWidth:24}}>{x.i}</div>
                <div><div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>{x.t}</div><div style={{fontSize:13,color:C.sub,lineHeight:1.6}}>{x.d}</div></div>
              </div>
            ))}
            <div style={{marginTop:12}}><Btn primary onClick={()=>setScr("home")} style={{borderRadius:100}}>¡Vamos!</Btn></div>
          </div>
        )}

        {/* ═══ HOME ═══ */}
        {scr==="home"&&(
          <div style={{paddingTop:36,paddingBottom:40}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
              <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:34,fontWeight:900,margin:0,color:C.gold,letterSpacing:-1}}>dime</h1>
              <div style={{display:"flex",gap:6}}>
                {[{icon:"?",fn:()=>setModal("how")},{icon:prog.sound?"♪":"✕",fn:()=>setProg(p=>({...p,sound:!p.sound}))},{icon:"↗",fn:share}].map((b,i)=>(
                  <button key={i} onClick={b.fn} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,width:34,height:34,color:C.sub,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>{b.icon}</button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {[{l:"XP",v:prog.xp,c:C.gold},{l:"STREAK",v:`${prog.streak}🔥`,c:"#F97316"},{l:"RANK",v:r.l,c:C.cyan}].map((s,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,flex:1,textAlign:"center",padding:"14px 8px"}}>
                  <div style={{fontSize:20,fontWeight:800,color:s.c,fontFamily:"'Playfair Display', serif"}}>{s.v}</div>
                  <div style={{fontSize:8,fontWeight:700,letterSpacing:2.5,color:C.muted,marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontSize:12,fontWeight:700,color:C.gold,opacity:0.7,letterSpacing:1}}>{r.t}{r.n&&<span style={{opacity:0.4,marginLeft:8}}>· {r.n-prog.xp} to next</span>}</div>
              {prog.ta>0&&<div style={{fontSize:11,color:C.muted}}>{Math.round(prog.tc/prog.ta*100)}% acc</div>}
            </div>

            {/* Levels */}
            <div style={{fontSize:9,fontWeight:700,letterSpacing:3,color:C.muted,marginBottom:10}}>LATIN AMERICAN SPANISH</div>
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:24}}>
              {LEVELS.slice(0,10).map((lv,i)=>{const u=unlk(i),d=prog.done.includes(i),h=prog.hi[i]; return(
                <button key={i} onClick={()=>u&&go(i)} disabled={!u} style={{background:d?"rgba(232,168,56,0.03)":C.card,border:d?`1px solid rgba(232,168,56,0.12)`:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,cursor:u?"pointer":"not-allowed",opacity:u?1:0.25,textAlign:"left",transition:"all 0.15s",width:"100%",color:"inherit",fontFamily:"inherit"}}>
                  <div style={{fontSize:22,width:34,textAlign:"center"}}>{lv.icon}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:d?C.gold:C.text}}>{lv.name}</div><div style={{fontSize:11,color:C.sub}}>{lv.desc}</div></div>
                  {d&&h&&<div style={{fontSize:9,fontWeight:700,color:C.gold,background:"rgba(232,168,56,0.08)",padding:"3px 10px",borderRadius:100}}>{h}</div>}
                  {!u&&<span style={{fontSize:13,opacity:0.5}}>🔒</span>}
                </button>
              );})}
            </div>

            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:3,color:"rgba(6,182,212,0.4)"}}>🇵🇷 CARIBBEAN / PR</div>
              {prog.done.filter(l=>l<=9).length<10&&<div style={{fontSize:9,color:C.muted}}>Complete all 10 to unlock</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:32}}>
              {LEVELS.slice(10).map((lv,i)=>{const idx=i+10,u=unlk(idx),d=prog.done.includes(idx),h=prog.hi[idx]; return(
                <button key={idx} onClick={()=>u&&go(idx)} disabled={!u} style={{background:d?"rgba(6,182,212,0.03)":C.card,border:d?"1px solid rgba(6,182,212,0.12)":`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,cursor:u?"pointer":"not-allowed",opacity:u?1:0.25,textAlign:"left",transition:"all 0.15s",width:"100%",color:"inherit",fontFamily:"inherit"}}>
                  <div style={{fontSize:22,width:34,textAlign:"center"}}>{lv.icon}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:d?C.cyan:C.text}}>{lv.name}</div><div style={{fontSize:11,color:C.sub}}>{lv.desc}</div></div>
                  {d&&h&&<div style={{fontSize:9,fontWeight:700,color:C.cyan,background:"rgba(6,182,212,0.08)",padding:"3px 10px",borderRadius:100}}>{h}</div>}
                  {!u&&<span style={{fontSize:13,opacity:0.5}}>🔒</span>}
                </button>
              );})}
            </div>

            <div style={{textAlign:"center"}}><button onClick={()=>{if(confirm("Reset all progress?")){const f={xp:0,streak:0,last:null,done:[],hi:{},tc:0,ta:0,sound:true};setProg(f);save(f);}}} style={{background:"none",border:"none",color:C.muted,fontSize:10,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>RESET PROGRESS</button></div>
          </div>
        )}

        {/* ═══ PLAY ═══ */}
        {scr==="play"&&cq&&(
          <div style={{paddingTop:28,paddingBottom:40}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <button onClick={()=>setScr("home")} style={{background:C.card,border:"none",borderRadius:10,padding:"7px 14px",color:C.sub,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>✕ QUIT</button>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {cmb>1&&<div style={{fontSize:12,fontWeight:800,color:"#F97316"}}>{cmb}x🔥</div>}
                <div style={{fontSize:13,fontWeight:700,color:C.gold}}>{pts}</div>
              </div>
            </div>

            <div style={{height:3,background:C.card,borderRadius:100,marginBottom:28,overflow:"hidden"}}><div style={{height:"100%",width:`${qi/qs.length*100}%`,background:`linear-gradient(90deg, ${C.gold}, #D97706)`,borderRadius:100,transition:"width 0.4s ease"}}/></div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:C.muted}}>{LEVELS[lvl].icon} {LEVELS[lvl].name.toUpperCase()}</div>
              <div style={{fontSize:10,color:C.muted}}>{qi+1}/{qs.length}</div>
            </div>

            <div style={{display:"inline-block",padding:"4px 12px",borderRadius:100,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16,
              background:cq.type==="translate"?"rgba(232,168,56,0.08)":cq.type==="fillblank"?"rgba(6,182,212,0.08)":"rgba(249,115,22,0.08)",
              color:cq.type==="translate"?C.gold:cq.type==="fillblank"?C.cyan:"#F97316",
            }}>{cq.type==="translate"?"TRANSLATE":cq.type==="fillblank"?"FILL IN BLANK":"SCENARIO"}</div>

            <div style={{fontSize:cq.q.length>50?18:23,fontWeight:800,lineHeight:1.35,marginBottom:28,color:"#F5F3FA",fontFamily:"'Playfair Display', serif"}}>{cq.q}</div>

            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {cq.options.map((o,i)=>{
                const iS=sel===o,iC=o===cq.a;let bg=C.card,bd=`1px solid ${C.border}`,tc=C.text;
                if(show&&iC){bg="rgba(16,185,129,0.06)";bd="1px solid rgba(16,185,129,0.25)";tc=C.green;}
                else if(show&&iS){bg="rgba(239,68,68,0.06)";bd="1px solid rgba(239,68,68,0.25)";tc=C.red;}
                return(
                  <button key={i} onClick={()=>pick(o)} disabled={show} style={{background:bg,border:bd,borderRadius:12,padding:"13px 16px",fontSize:o.length>40?12:14,fontWeight:600,color:tc,cursor:show?"default":"pointer",textAlign:"left",transition:"all 0.15s",fontFamily:"inherit",lineHeight:1.4,display:"flex",alignItems:"center",gap:12}}>
                    <span style={{width:24,height:24,borderRadius:7,background:show&&iC?"rgba(16,185,129,0.1)":show&&iS?"rgba(239,68,68,0.1)":"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0,color:show&&iC?C.green:show&&iS?C.red:C.muted}}>
                      {show&&iC?"✓":show&&iS&&!iC?"✕":String.fromCharCode(65+i)}
                    </span>
                    <span style={{flex:1}}>{o}</span>
                    {show&&iC&&<button onClick={e=>{e.stopPropagation();speak(o);}} style={{background:"rgba(16,185,129,0.08)",border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>🔊</button>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {scr==="results"&&(
          <div style={{paddingTop:48,paddingBottom:40,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:10}}>{pts>=qs.length*10*.9?"🔥":pts>=qs.length*10*.7?"💪":pts>=qs.length*10*.5?"👍":"📚"}</div>
            <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:28,fontWeight:900,margin:"0 0 4px",color:C.gold}}>
              {pts>=qs.length*10*.9?"¡Brutal!":pts>=qs.length*10*.7?"¡Bien hecho!":pts>=qs.length*10*.5?"Getting there":"Keep going"}
            </h2>
            <div style={{fontSize:12,color:C.sub,marginBottom:28}}>{LEVELS[lvl].icon} {LEVELS[lvl].name}</div>

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:24,marginBottom:20}}>
              <div style={{fontSize:42,fontWeight:900,fontFamily:"'Playfair Display', serif",color:C.gold}}>{pts}</div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:2.5,color:C.muted,marginTop:2}}>POINTS</div>
              <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:18}}>
                {[{v:res.filter(r=>r.ok).length,l:"CORRECT",c:C.green},{v:res.filter(r=>!r.ok).length,l:"WRONG",c:C.red},{v:`${prog.streak}🔥`,l:"STREAK",c:"#F97316"}].map((s,i)=>(
                  <div key={i}><div style={{fontSize:17,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:8,color:C.muted,letterSpacing:1}}>{s.l}</div></div>
                ))}
              </div>
            </div>

            {res.some(r=>!r.ok)&&(
              <div style={{background:"rgba(239,68,68,0.03)",border:"1px solid rgba(239,68,68,0.08)",borderRadius:14,padding:18,textAlign:"left",marginBottom:20}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:C.red,marginBottom:10}}>REVIEW</div>
                {res.filter(r=>!r.ok).map((r,i)=>(
                  <div key={i} style={{padding:"7px 0",borderBottom:i<res.filter(x=>!x.ok).length-1?`1px solid ${C.border}`:"none"}}>
                    <div style={{fontSize:11,color:C.sub,marginBottom:2}}>{r.q}</div>
                    <div style={{fontSize:12,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{color:C.red,textDecoration:"line-through"}}>{r.you}</span>
                      <span style={{color:C.muted}}>→</span>
                      <span style={{color:C.green,fontWeight:700}}>{r.ans}</span>
                      <button onClick={()=>speak(r.ans)} style={{background:"rgba(16,185,129,0.06)",border:"none",borderRadius:5,width:22,height:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>🔊</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              <Btn primary onClick={()=>go(lvl)}>Play Again</Btn>
              {lvl+1<LEVELS.length&&unlk(lvl+1)&&<Btn onClick={()=>go(lvl+1)}>Next Level →</Btn>}
              <Btn onClick={share}>Share Progress ↗</Btn>
              <button onClick={()=>setScr("home")} style={{background:"none",border:"none",padding:12,fontSize:12,color:C.muted,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>BACK TO LEVELS</button>
            </div>
          </div>
        )}

        {/* ═══ HOW TO PLAY MODAL ═══ */}
        {modal==="how"&&(
          <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.94)",backdropFilter:"blur(16px)",overflowY:"auto",padding:"56px 28px 40px"}}>
            <div style={{maxWidth:400,margin:"0 auto"}}>
              <button onClick={()=>setModal(null)} style={{position:"fixed",top:16,right:16,background:C.card,border:"none",borderRadius:10,width:34,height:34,color:C.sub,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:501}}>✕</button>
              <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:26,fontWeight:900,marginBottom:24,color:C.gold}}>How to play</h2>
              {[
                {i:"🔤",t:"Translate",d:"English word → pick the Spanish translation."},
                {i:"✏️",t:"Fill in the Blank",d:"Complete the sentence with the missing word."},
                {i:"🎭",t:"Scenario",d:"Real-life situation. Choose your response in Spanish."},
                {i:"🔊",t:"Audio",d:"Tap the speaker on correct answers to hear pronunciation."},
                {i:"🔥",t:"Combos",d:"Chain correct answers for bonus points. Miss one, combo resets."},
                {i:"📅",t:"Streaks",d:"Play daily. Miss a day, streak resets to zero."},
                {i:"🇵🇷",t:"Caribbean",d:"Complete all 10 neutral levels to unlock PR dialect."},
              ].map((x,i)=>(
                <div key={i} style={{display:"flex",gap:14,marginBottom:18}}>
                  <div style={{fontSize:20,width:30,textAlign:"center",flexShrink:0}}>{x.i}</div>
                  <div><div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>{x.t}</div><div style={{fontSize:12,color:C.sub,lineHeight:1.5}}>{x.d}</div></div>
                </div>
              ))}
              <div style={{marginTop:16}}><Btn onClick={()=>setModal(null)} style={{borderRadius:100}}>Got it</Btn></div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.05)}}button:hover:not(:disabled){filter:brightness(1.08)}button:active:not(:disabled){transform:scale(.98)}*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:100px}`}</style>
    </div>
  );
}
