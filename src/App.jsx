import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, orderBy, serverTimestamp } from "firebase/firestore";

/* ═══════════════════════════════════════════════
   DIME v2 — Learn Conversational Spanish & German
   "dee-meh" — Talk to me.
   A product of The Premise
   ═══════════════════════════════════════════════ */

const firebaseConfig = {
  apiKey: "AIzaSyBvn9IZcL618S2jhArXWa--K123Y1i-f7g",
  authDomain: "ds-dynamic-app.firebaseapp.com",
  projectId: "ds-dynamic-app",
  storageBucket: "ds-dynamic-app.firebasestorage.app",
  messagingSenderId: "366254576022",
  appId: "1:366254576022:web:dd0a197b734f498e8fcdb7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ═══════════ LEVELS ═══════════
const LANGS = {
  es: { name: "Spanish", flag: "🇪🇸", label: "Español" },
  de: { name: "German", flag: "🇩🇪", label: "Deutsch" },
  ja: { name: "Japanese", flag: "🇯🇵", label: "日本語", coming: true },
  zh: { name: "Chinese", flag: "🇨🇳", label: "中文", coming: true },
};

const ES_LEVELS = [
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

const DE_LEVELS = [
  { name: "Das Alphabet", desc: "Sounds & Pronunciation", dialect: "neutral", icon: "🔤" },
  { name: "Begrüßungen", desc: "Greetings & Basics", dialect: "neutral", icon: "👋" },
  { name: "Essen & Trinken", desc: "Food & Drink", dialect: "neutral", icon: "🍽️" },
  { name: "Zahlen", desc: "Numbers & Counting", dialect: "neutral", icon: "🔢" },
  { name: "Die Stadt", desc: "Getting Around", dialect: "neutral", icon: "🏙️" },
  { name: "Arbeit", desc: "Work & Daily Life", dialect: "neutral", icon: "💼" },
  { name: "Das Wetter", desc: "Weather & Time", dialect: "neutral", icon: "⛅" },
  { name: "Die Familie", desc: "Family & People", dialect: "neutral", icon: "👨‍👩‍👧‍👦" },
  { name: "Verben", desc: "Essential Verbs", dialect: "neutral", icon: "⚡" },
  { name: "Gespräche", desc: "Real Conversations", dialect: "neutral", icon: "💬" },
];

// ═══════════ SPANISH QUESTIONS (with explanations + phonetics) ═══════════
const ES_Q = {
  0: [
    { type:"translate",q:"Hello",a:"Hola",o:["Hola","Adiós","Gracias","Bueno"],ph:"OH-lah",ex:"The universal Spanish greeting — works any time of day." },
    { type:"translate",q:"Good morning",a:"Buenos días",o:["Buenas noches","Buenos días","Buenas tardes","Hasta luego"],ph:"BWEH-nohs DEE-ahs",ex:"'Buenos' = good, 'días' = days. Used until about noon." },
    { type:"translate",q:"How are you?",a:"¿Cómo estás?",o:["¿Cómo estás?","¿Qué hora es?","¿Dónde estás?","¿Quién eres?"],ph:"KOH-moh ehs-TAHS",ex:"'Cómo' = how, 'estás' = you are (temporary state)." },
    { type:"fillblank",q:"Buenos _____, señor.",a:"días",o:["días","noche","hola","bien"],ph:"DEE-ahs",ex:"Morning greeting. 'Noches' would be nighttime." },
    { type:"translate",q:"Goodbye",a:"Adiós",o:["Hola","Gracias","Adiós","Por favor"],ph:"ah-dee-OHS",ex:"Literally 'to God' — a formal farewell." },
    { type:"scenario",q:"You walk into a shop at 3pm. What do you say?",a:"Buenas tardes",o:["Buenos días","Buenas tardes","Buenas noches","Hola, amigo"],ph:"BWEH-nahs TAR-dehs",ex:"Afternoon (roughly noon to sundown) = 'buenas tardes'." },
    { type:"translate",q:"Thank you",a:"Gracias",o:["De nada","Por favor","Gracias","Lo siento"],ph:"GRAH-see-ahs",ex:"One of the most important words. 'Muchas gracias' = thank you very much." },
    { type:"fillblank",q:"Mucho _____ en conocerte.",a:"gusto",o:["bien","gusto","hola","grande"],ph:"GOOSE-toh",ex:"'Mucho gusto' = much pleasure. It's 'nice to meet you'." },
    { type:"translate",q:"Please",a:"Por favor",o:["Gracias","De nada","Lo siento","Por favor"],ph:"por fah-VOR",ex:"Literally 'as a favor' — always polite to add." },
    { type:"scenario",q:"Someone says 'Gracias.' How do you respond?",a:"De nada",o:["Hola","Adiós","De nada","Buenos días"],ph:"deh NAH-dah",ex:"'De nada' = of nothing. It's 'you're welcome'." },
    { type:"translate",q:"I'm sorry",a:"Lo siento",o:["Lo siento","Con permiso","De nada","Perdón"],ph:"loh see-EHN-toh",ex:"Literally 'I feel it' — used for apologies." },
    { type:"translate",q:"Excuse me",a:"Disculpe",o:["Gracias","Disculpe","Hola","Perdón"],ph:"dees-KOOL-peh",ex:"Formal way to get attention or apologize. 'Perdón' is more casual." },
    { type:"fillblank",q:"¿Cómo te _____?",a:"llamas",o:["llamas","estás","sientes","haces"],ph:"YAH-mahs",ex:"'Llamar' = to call. 'Te llamas' = you call yourself (your name)." },
    { type:"scenario",q:"You bump into someone on the street:",a:"¡Perdón! Lo siento",o:["Hola, ¿cómo estás?","¡Perdón! Lo siento","Buenos días","Adiós"],ph:"pehr-DOHN",ex:"'Perdón' for quick apology + 'lo siento' for emphasis." },
    { type:"translate",q:"My name is...",a:"Me llamo...",o:["Yo soy...","Me llamo...","Tengo...","Estoy..."],ph:"meh YAH-moh",ex:"Literally 'I call myself...' The standard way to give your name." },
    { type:"translate",q:"Nice to meet you",a:"Mucho gusto",o:["Buenas tardes","Mucho gusto","Hasta luego","Con permiso"],ph:"MOO-choh GOOSE-toh",ex:"Literally 'much pleasure.' Said when meeting someone new." },
    { type:"fillblank",q:"Hasta _____, amigo.",a:"luego",o:["mañana","luego","pronto","bien"],ph:"LWEH-goh",ex:"'Hasta luego' = until later. 'Hasta mañana' = until tomorrow." },
    { type:"scenario",q:"It's 9pm. Greet your neighbor:",a:"Buenas noches",o:["Buenos días","Buenas tardes","Buenas noches","Hola, buenos"],ph:"BWEH-nahs NOH-chehs",ex:"After sundown = 'buenas noches'. Also used to say goodnight." },
    { type:"translate",q:"See you tomorrow",a:"Hasta mañana",o:["Hasta luego","Hasta mañana","Nos vemos","Buenas noches"],ph:"AHS-tah mahn-YAH-nah",ex:"'Hasta' = until, 'mañana' = tomorrow (also means morning)." },
    { type:"fillblank",q:"Yo _____ bien, gracias.",a:"estoy",o:["soy","estoy","tengo","hago"],ph:"ehs-TOY",ex:"'Estoy' (estar) for how you feel right now. 'Soy' (ser) is for permanent traits." },
  ],
  1: [
    { type:"translate",q:"I am (permanent trait)",a:"Yo soy",o:["Yo soy","Yo estoy","Yo tengo","Yo voy"],ph:"yoh SOY",ex:"Ser = permanent things: nationality, profession, personality." },
    { type:"translate",q:"I am (temporary state)",a:"Yo estoy",o:["Yo soy","Yo estoy","Yo era","Yo fui"],ph:"yoh ehs-TOY",ex:"Estar = temporary things: mood, location, condition." },
    { type:"fillblank",q:"Yo _____ de Washington DC.",a:"soy",o:["estoy","soy","tengo","voy"],ph:"SOY",ex:"Where you're FROM = ser. Where you ARE right now = estar." },
    { type:"fillblank",q:"Yo _____ cansado hoy.",a:"estoy",o:["soy","estoy","tengo","era"],ph:"ehs-TOY",ex:"Tired is temporary → estar. You won't be tired forever." },
    { type:"scenario",q:"Tell someone where you are FROM:",a:"Soy de DC",o:["Estoy en DC","Soy de DC","Voy a DC","Tengo DC"],ph:"SOY deh",ex:"Origin = ser. 'Estoy en DC' means you're currently located there." },
    { type:"translate",q:"She is tall (permanent)",a:"Ella es alta",o:["Ella es alta","Ella está alta","Ella tiene alta","Ella va alta"],ph:"EH-yah ehs AHL-tah",ex:"Height is permanent → ser. 'Está alta' would imply she grew temporarily." },
    { type:"fillblank",q:"Nosotros _____ en la oficina.",a:"estamos",o:["somos","estamos","tenemos","vamos"],ph:"ehs-TAH-mohs",ex:"Location = estar. You're AT the office right now, not permanently." },
    { type:"translate",q:"They are students",a:"Ellos son estudiantes",o:["Ellos están estudiantes","Ellos son estudiantes","Ellos tienen estudiantes","Ellos van estudiantes"],ph:"EH-yohs sohn ehs-too-dee-AHN-tehs",ex:"Identity/role = ser. Being a student defines who they are." },
    { type:"fillblank",q:"La comida _____ deliciosa.",a:"está",o:["es","está","son","están"],ph:"ehs-TAH",ex:"The food tastes delicious RIGHT NOW → estar. It's a current experience." },
    { type:"scenario",q:"Describe your mood right now:",a:"Estoy bien",o:["Soy bien","Estoy bien","Tengo bien","Hago bien"],ph:"ehs-TOY bee-EHN",ex:"Mood = temporary → estar. 'Soy bien' doesn't work in Spanish." },
    { type:"translate",q:"He is a doctor (profession)",a:"Él es doctor",o:["Él está doctor","Él es doctor","Él tiene doctor","Él va doctor"],ph:"ehl ehs dok-TOR",ex:"Profession = identity → ser." },
    { type:"fillblank",q:"La fiesta _____ en mi casa.",a:"es",o:["es","está","son","hay"],ph:"ehs",ex:"Events use ser for location. 'The party IS at my house' = es." },
    { type:"scenario",q:"Say the coffee is hot (temporary):",a:"El café está caliente",o:["El café es caliente","El café está caliente","El café tiene caliente","El café va caliente"],ph:"ehs-TAH kah-lee-EHN-teh",ex:"Temperature is a current condition → estar." },
    { type:"translate",q:"We are happy (right now)",a:"Estamos contentos",o:["Somos contentos","Estamos contentos","Tenemos contentos","Vamos contentos"],ph:"ehs-TAH-mohs kohn-TEHN-tohs",ex:"Current emotion → estar." },
    { type:"fillblank",q:"Ella _____ muy inteligente.",a:"es",o:["es","está","tiene","va"],ph:"ehs",ex:"Intelligence is a permanent trait → ser." },
    { type:"translate",q:"The door is open (state)",a:"La puerta está abierta",o:["La puerta es abierta","La puerta está abierta","La puerta tiene abierta","La puerta va abierta"],ph:"ehs-TAH ah-bee-EHR-tah",ex:"Open/closed is a current state → estar." },
    { type:"scenario",q:"Say you are tired today:",a:"Hoy estoy cansado",o:["Hoy soy cansado","Hoy estoy cansado","Hoy tengo cansado","Hoy voy cansado"],ph:"ehs-TOY kahn-SAH-doh",ex:"Tiredness is temporary → estar." },
    { type:"fillblank",q:"¿Dónde _____ el baño?",a:"está",o:["es","está","son","hay"],ph:"ehs-TAH",ex:"Location of a physical thing → estar." },
    { type:"translate",q:"You are very kind (trait)",a:"Eres muy amable",o:["Estás muy amable","Eres muy amable","Tienes muy amable","Vas muy amable"],ph:"EH-rehs mooy ah-MAH-bleh",ex:"Kindness as a personality trait → ser." },
    { type:"fillblank",q:"Yo _____ mexicano.",a:"soy",o:["soy","estoy","tengo","hago"],ph:"SOY",ex:"Nationality is permanent → ser." },
  ],
  2: [
    { type:"translate",q:"Water",a:"Agua",o:["Leche","Agua","Jugo","Café"],ph:"AH-gwah",ex:"One of the first survival words. 'Agua, por favor' gets you far." },
    { type:"translate",q:"Chicken",a:"Pollo",o:["Cerdo","Pescado","Pollo","Carne"],ph:"POH-yoh",ex:"Most common meat in Latin American cuisine." },
    { type:"fillblank",q:"Quiero un café con _____.",a:"leche",o:["agua","arroz","leche","pollo"],ph:"LEH-cheh",ex:"'Leche' = milk. 'Café con leche' is coffee with milk." },
    { type:"scenario",q:"Ask for the check:",a:"La cuenta, por favor",o:["El menú, por favor","La cuenta, por favor","Más agua, por favor","La comida, por favor"],ph:"lah KWEHN-tah",ex:"'Cuenta' = check/bill. Essential restaurant phrase." },
    { type:"translate",q:"I'm hungry",a:"Tengo hambre",o:["Estoy hambre","Soy hambre","Tengo hambre","Quiero hambre"],ph:"TEHN-goh AHM-breh",ex:"Spanish says 'I HAVE hunger' not 'I AM hungry'. Same for thirst." },
    { type:"translate",q:"Breakfast",a:"Desayuno",o:["Almuerzo","Cena","Desayuno","Merienda"],ph:"deh-sah-YOO-noh",ex:"Literally 'un-fast' — breaking the fast. Almuerzo=lunch, Cena=dinner." },
    { type:"fillblank",q:"Me gustaría _____ el pollo.",a:"ordenar",o:["comer","ordenar","beber","cocinar"],ph:"or-deh-NAR",ex:"'Ordenar' = to order. 'Comer' = to eat. Different actions." },
    { type:"scenario",q:"Order a coffee with milk:",a:"Un café con leche, por favor",o:["Quiero agua","Un café con leche, por favor","Dame arroz","Necesito pollo"],ph:"oon kah-FEH kohn LEH-cheh",ex:"'Un' = a/one, 'con' = with. Simple and polite." },
    { type:"translate",q:"Delicious",a:"Delicioso",o:["Caliente","Frío","Delicioso","Picante"],ph:"deh-lee-see-OH-soh",ex:"Also 'rico' or 'sabroso' in casual speech." },
    { type:"translate",q:"Beer",a:"Cerveza",o:["Vino","Cerveza","Refresco","Jugo"],ph:"sehr-VEH-sah",ex:"'Una cerveza, por favor' — you'll use this one." },
    { type:"fillblank",q:"La sopa está muy _____.",a:"caliente",o:["fría","caliente","grande","buena"],ph:"kah-lee-EHN-teh",ex:"'Caliente' = hot (temperature). 'Picante' = hot (spicy)." },
    { type:"translate",q:"I'm thirsty",a:"Tengo sed",o:["Tengo hambre","Tengo sed","Estoy sed","Quiero sed"],ph:"TEHN-goh SEHD",ex:"'Tengo sed' = I have thirst. Same pattern as hunger." },
    { type:"scenario",q:"Ask what the waiter recommends:",a:"¿Qué me recomienda?",o:["¿Cuánto cuesta?","¿Qué me recomienda?","¿Dónde está el baño?","¿Tiene agua?"],ph:"keh meh reh-koh-mee-EHN-dah",ex:"Great way to discover local favorites at any restaurant." },
    { type:"translate",q:"The menu",a:"El menú",o:["La carta","El menú","La cuenta","El plato"],ph:"ehl meh-NOO",ex:"'La carta' also works for menu in some countries." },
    { type:"translate",q:"Spicy",a:"Picante",o:["Dulce","Salado","Picante","Amargo"],ph:"pee-KAHN-teh",ex:"Don't confuse with 'caliente' (hot temperature)." },
    { type:"scenario",q:"Tell the waiter you don't eat meat:",a:"No como carne",o:["No tengo hambre","No como carne","No quiero postre","No bebo alcohol"],ph:"noh KOH-moh KAR-neh",ex:"'Como' = I eat, 'carne' = meat. Direct and clear." },
    { type:"translate",q:"Dessert",a:"Postre",o:["Entrada","Postre","Plato","Bebida"],ph:"POHS-treh",ex:"'Entrada' = appetizer/starter, 'postre' = dessert." },
    { type:"translate",q:"Rice",a:"Arroz",o:["Pan","Arroz","Pollo","Carne"],ph:"ah-ROHS",ex:"Staple in Latin American cuisine. 'Arroz con pollo' = rice with chicken." },
    { type:"fillblank",q:"Quiero _____ más, por favor.",a:"pan",o:["pan","mesa","silla","cuenta"],ph:"PAHN",ex:"'Pan' = bread. 'Más' = more." },
    { type:"fillblank",q:"La _____ estuvo excelente.",a:"comida",o:["mesa","comida","cuenta","silla"],ph:"koh-MEE-dah",ex:"'Comida' = food/meal. 'Mesa' = table, 'silla' = chair." },
  ],
  // Levels 3-9 abbreviated for size — same structure with ph and ex fields
  3: [
    { type:"translate",q:"One",a:"Uno",o:["Uno","Dos","Tres","Diez"],ph:"OO-noh",ex:"The basics. Uno, dos, tres, cuatro, cinco..." },
    { type:"translate",q:"Twenty",a:"Veinte",o:["Doce","Quince","Veinte","Treinta"],ph:"VAIN-teh",ex:"11-15 are unique. 16-19 are 'dieci+number'. 20 is 'veinte'." },
    { type:"translate",q:"One hundred",a:"Cien",o:["Diez","Mil","Cien","Cincuenta"],ph:"see-EHN",ex:"'Cien' = exactly 100. 'Ciento' + number for 101-199." },
    { type:"fillblank",q:"Tengo _____ años. (35)",a:"treinta y cinco",o:["veinticinco","treinta y cinco","cuarenta","quince"],ph:"TRAIN-tah ee SEEN-koh",ex:"30+ numbers: thirty AND five. Always 'y' (and) between." },
    { type:"translate",q:"How much does it cost?",a:"¿Cuánto cuesta?",o:["¿Qué hora es?","¿Cuánto cuesta?","¿Dónde está?","¿Cuántos hay?"],ph:"KWAHN-toh KWEHS-tah",ex:"Essential shopping phrase. 'Cuánto' = how much." },
    { type:"fillblank",q:"Son _____ dólares. ($50)",a:"cincuenta",o:["quince","cincuenta","quinientos","cinco"],ph:"seen-KWEHN-tah",ex:"50 = cincuenta. 500 = quinientos. Don't mix them up." },
    { type:"translate",q:"First",a:"Primero",o:["Segundo","Primero","Último","Tercero"],ph:"pree-MEH-roh",ex:"Primero, segundo, tercero = first, second, third." },
    { type:"scenario",q:"Say 'five, five, five':",a:"Cinco, cinco, cinco",o:["Tres, tres, tres","Cinco, cinco, cinco","Seis, seis, seis","Uno, uno, uno"],ph:"SEEN-koh",ex:"Phone numbers are said digit by digit in Spanish." },
    { type:"translate",q:"Half",a:"Medio",o:["Todo","Medio","Doble","Poco"],ph:"MEH-dee-oh",ex:"'Media hora' = half hour. 'Mediodía' = noon (midday)." },
    { type:"fillblank",q:"Necesito _____ minutos. (10)",a:"diez",o:["dos","cinco","diez","veinte"],ph:"dee-EHS",ex:"Diez = 10. One of the first numbers to memorize." },
    { type:"translate",q:"Fifteen",a:"Quince",o:["Cinco","Quince","Cincuenta","Quinientos"],ph:"KEEN-seh",ex:"11-15 have unique forms: once, doce, trece, catorce, quince." },
    { type:"translate",q:"One thousand",a:"Mil",o:["Cien","Mil","Millón","Diez mil"],ph:"MEEL",ex:"'Mil' = 1,000. 'Un millón' = 1,000,000." },
    { type:"fillblank",q:"Hay _____ personas aquí. (12)",a:"doce",o:["dos","diez","doce","veinte"],ph:"DOH-seh",ex:"'Doce' = 12. 'Dos' = 2. Easy to confuse." },
    { type:"scenario",q:"Ask how many people are in line:",a:"¿Cuántas personas hay en la fila?",o:["¿Dónde está la fila?","¿Cuántas personas hay en la fila?","¿Cuánto cuesta?","¿Quién es el último?"],ph:"KWAHN-tahs pehr-SOH-nahs",ex:"'Cuántas' (feminine) matches 'personas'. 'Fila' = line/queue." },
    { type:"translate",q:"Forty",a:"Cuarenta",o:["Catorce","Cuarenta","Cuatrocientos","Cincuenta"],ph:"kwah-REHN-tah",ex:"Catorce=14, Cuarenta=40, Cuatrocientos=400. Pattern recognition." },
    { type:"translate",q:"Zero",a:"Cero",o:["Uno","Nada","Cero","Ninguno"],ph:"SEH-roh",ex:"'Nada' = nothing (noun). 'Cero' = the number zero." },
    { type:"scenario",q:"Tell a taxi: address number 1500:",a:"Número mil quinientos",o:["Número quince","Número ciento cincuenta","Número mil quinientos","Número quinientos"],ph:"NOO-meh-roh meel kee-nee-EHN-tohs",ex:"1500 = mil (1000) + quinientos (500)." },
    { type:"translate",q:"Third",a:"Tercero",o:["Primero","Segundo","Tercero","Cuarto"],ph:"tehr-SEH-roh",ex:"Ordinal numbers: primero, segundo, tercero, cuarto, quinto." },
    { type:"fillblank",q:"Somos _____ en el equipo. (6)",a:"seis",o:["tres","cinco","seis","siete"],ph:"SAYS",ex:"Seis = 6. Siete = 7. Close but different." },
    { type:"fillblank",q:"Mi dirección es el número _____. (200)",a:"doscientos",o:["veinte","doscientos","dos mil","doce"],ph:"dohs-see-EHN-tohs",ex:"200 = doscientos. 2000 = dos mil. 20 = veinte." },
  ],
  4: [
    { type:"translate",q:"Where is...?",a:"¿Dónde está...?",o:["¿Cómo está...?","¿Dónde está...?","¿Qué es...?","¿Cuándo es...?"],ph:"DOHN-deh ehs-TAH",ex:"'Dónde' = where. Uses 'estar' because location is temporary." },
    { type:"translate",q:"Turn left",a:"Doble a la izquierda",o:["Siga derecho","Doble a la izquierda","Doble a la derecha","Pare aquí"],ph:"DOH-bleh ah lah ees-kee-EHR-dah",ex:"'Doble' = turn, 'izquierda' = left, 'derecha' = right." },
    { type:"fillblank",q:"El restaurante está a la _____.",a:"derecha",o:["arriba","abajo","derecha","lejos"],ph:"deh-REH-chah",ex:"'A la derecha' = to the right. 'A la izquierda' = to the left." },
    { type:"scenario",q:"Ask where the metro is:",a:"Disculpe, ¿dónde está el metro?",o:["¿Qué hora es?","Disculpe, ¿dónde está el metro?","Quiero ir al parque","¿Cuánto cuesta?"],ph:"dees-KOOL-peh DOHN-deh ehs-TAH ehl MEH-troh",ex:"Start with 'disculpe' (excuse me) to be polite." },
    { type:"translate",q:"Go straight",a:"Siga derecho",o:["Doble aquí","Siga derecho","Pare ahora","Vaya atrás"],ph:"SEE-gah deh-REH-choh",ex:"'Siga' = continue/follow, 'derecho' = straight." },
    { type:"translate",q:"Near / Far",a:"Cerca / Lejos",o:["Grande / Pequeño","Cerca / Lejos","Arriba / Abajo","Aquí / Allá"],ph:"SEHR-kah / LEH-hohs",ex:"'Cerca de aquí' = near here. 'Lejos' = far away." },
    { type:"fillblank",q:"_____ un taxi, por favor.",a:"Necesito",o:["Quiero","Necesito","Tengo","Soy"],ph:"neh-seh-SEE-toh",ex:"'Necesito' = I need. Stronger than 'quiero' (I want)." },
    { type:"translate",q:"The store",a:"La tienda",o:["La casa","La tienda","La iglesia","La escuela"],ph:"lah tee-EHN-dah",ex:"'Tienda' = store/shop. General term for any shop." },
    { type:"scenario",q:"Tell a taxi to stop here:",a:"Pare aquí, por favor",o:["Vamos rápido","Pare aquí, por favor","Siga derecho","Doble a la derecha"],ph:"PAH-reh ah-KEE",ex:"'Pare' = stop (command). 'Aquí' = here." },
    { type:"translate",q:"Street",a:"La calle",o:["El parque","La calle","El edificio","La plaza"],ph:"lah KAH-yeh",ex:"'Calle' = street. 'Avenida' = avenue." },
    { type:"fillblank",q:"¿_____ lejos de aquí?",a:"Está",o:["Es","Está","Hay","Tiene"],ph:"ehs-TAH",ex:"Asking about distance/location = estar." },
    { type:"translate",q:"Behind",a:"Detrás",o:["Delante","Detrás","Encima","Debajo"],ph:"deh-TRAHS",ex:"'Detrás de' = behind. 'Delante de' = in front of." },
    { type:"scenario",q:"Ask how far the airport is:",a:"¿Qué tan lejos está el aeropuerto?",o:["¿Dónde está el avión?","¿Qué tan lejos está el aeropuerto?","¿Cuánto cuesta el vuelo?","¿A qué hora sale?"],ph:"keh tahn LEH-hohs ehs-TAH ehl ah-eh-roh-PWEHR-toh",ex:"'Qué tan lejos' = how far. Useful for planning travel." },
    { type:"translate",q:"Next to",a:"Al lado de",o:["Encima de","Al lado de","Debajo de","Lejos de"],ph:"ahl LAH-doh deh",ex:"'Al lado de' = at the side of. Common for giving directions." },
    { type:"fillblank",q:"El banco está _____ de la farmacia.",a:"enfrente",o:["dentro","enfrente","encima","debajo"],ph:"ehn-FREHN-teh",ex:"'Enfrente de' = in front of / across from." },
    { type:"translate",q:"Corner",a:"La esquina",o:["La calle","La esquina","La cuadra","La avenida"],ph:"lah ehs-KEE-nah",ex:"'En la esquina' = on the corner. Key for directions." },
    { type:"scenario",q:"Ask someone to repeat directions:",a:"¿Puede repetir, por favor?",o:["Más despacio","¿Puede repetir, por favor?","No entiendo","Hable más alto"],ph:"PWEH-deh reh-peh-TEER",ex:"Polite way to ask for repetition. You'll need this a lot." },
    { type:"translate",q:"Block (city)",a:"La cuadra",o:["La calle","La cuadra","El barrio","La zona"],ph:"lah KWAH-drah",ex:"'Dos cuadras' = two blocks. Standard distance measure." },
    { type:"fillblank",q:"Camine dos _____ más.",a:"cuadras",o:["calles","cuadras","metros","pasos"],ph:"KWAH-drahs",ex:"Walk two more blocks. 'Cuadras' is the standard unit." },
    { type:"translate",q:"In front of",a:"Enfrente de",o:["Detrás de","Enfrente de","Al lado de","Lejos de"],ph:"ehn-FREHN-teh deh",ex:"Also 'delante de'. Both mean in front of." },
  ],
  5: [
    { type:"translate",q:"I work in government",a:"Trabajo en el gobierno",o:["Trabajo en el gobierno","Estudio en la universidad","Vivo en la ciudad","Voy a la oficina"],ph:"trah-BAH-hoh ehn ehl goh-bee-EHR-noh",ex:"'Trabajo' = I work. 'Gobierno' = government." },
    { type:"fillblank",q:"Soy _____ de programa.",a:"gerente",o:["doctor","gerente","profesor","abogado"],ph:"heh-REHN-teh",ex:"'Gerente' = manager. Common professional title." },
    { type:"translate",q:"Meeting",a:"Reunión",o:["Oficina","Reunión","Proyecto","Equipo"],ph:"reh-oo-nee-OHN",ex:"'Tengo una reunión' = I have a meeting." },
    { type:"translate",q:"Team",a:"Equipo",o:["Grupo","Equipo","Jefe","Trabajo"],ph:"eh-KEE-poh",ex:"Also means 'equipment'. Context makes it clear." },
    { type:"scenario",q:"Introduce your job:",a:"Trabajo en el gobierno como gerente",o:["Soy estudiante","Trabajo en el gobierno como gerente","No tengo trabajo","Voy a la oficina"],ph:"KOH-moh heh-REHN-teh",ex:"'Como' = as. Natural way to describe your role." },
    { type:"fillblank",q:"Tengo una _____ a las tres.",a:"reunión",o:["comida","reunión","fiesta","clase"],ph:"reh-oo-nee-OHN",ex:"'A las tres' = at three. Meeting at 3:00." },
    { type:"translate",q:"Boss",a:"Jefe",o:["Amigo","Jefe","Compañero","Cliente"],ph:"HEH-feh",ex:"'Jefa' for female boss. 'Mi jefe' = my boss." },
    { type:"translate",q:"Project",a:"Proyecto",o:["Trabajo","Oficina","Proyecto","Problema"],ph:"proh-YEHK-toh",ex:"Same word root as English 'project'." },
    { type:"fillblank",q:"Mi _____ tiene diecinueve personas.",a:"equipo",o:["oficina","equipo","familia","clase"],ph:"eh-KEE-poh",ex:"'Mi equipo' = my team. 'Tiene' = has." },
    { type:"scenario",q:"Say you're busy:",a:"Estoy ocupado con el trabajo",o:["No tengo tiempo","Estoy ocupado con el trabajo","Voy a casa","Quiero descansar"],ph:"ehs-TOY oh-koo-PAH-doh",ex:"'Ocupado' = busy/occupied. Uses estar (temporary state)." },
    { type:"translate",q:"Schedule",a:"Horario",o:["Calendario","Horario","Reloj","Tiempo"],ph:"oh-RAH-ree-oh",ex:"'Horario' = schedule/timetable. 'Calendario' = calendar." },
    { type:"fillblank",q:"Necesito terminar este _____ hoy.",a:"proyecto",o:["reunión","proyecto","equipo","jefe"],ph:"proh-YEHK-toh",ex:"'Terminar' = to finish. 'Hoy' = today." },
    { type:"translate",q:"Email",a:"Correo electrónico",o:["Mensaje","Correo electrónico","Carta","Teléfono"],ph:"koh-REH-oh eh-lehk-TROH-nee-koh",ex:"Often shortened to just 'correo' in conversation." },
    { type:"scenario",q:"Ask what time the meeting is:",a:"¿A qué hora es la reunión?",o:["¿Dónde es la reunión?","¿A qué hora es la reunión?","¿Quién viene?","¿Por qué hay reunión?"],ph:"ah keh OH-rah ehs",ex:"'¿A qué hora?' = at what time? Very useful phrase." },
    { type:"translate",q:"Coworker",a:"Compañero de trabajo",o:["Amigo","Compañero de trabajo","Jefe","Empleado"],ph:"kohm-pahn-YEH-roh deh trah-BAH-hoh",ex:"Literally 'companion of work'. 'Colega' also works." },
    { type:"fillblank",q:"Voy a _____ a las seis.",a:"salir",o:["comer","salir","dormir","llegar"],ph:"sah-LEER",ex:"'Salir' = to leave/go out. 'Voy a salir' = I'm going to leave." },
    { type:"translate",q:"Deadline",a:"Fecha límite",o:["Hora final","Fecha límite","Día último","Tiempo final"],ph:"FEH-chah LEE-mee-teh",ex:"'Fecha' = date, 'límite' = limit. Deadline." },
    { type:"scenario",q:"Say you'll finish by Friday:",a:"Lo termino para el viernes",o:["Lo hago mañana","Lo termino para el viernes","No puedo hoy","Necesito más tiempo"],ph:"loh tehr-MEE-noh PAH-rah ehl vee-EHR-nehs",ex:"'Para' = by/for. 'Viernes' = Friday." },
    { type:"translate",q:"Salary",a:"Salario",o:["Dinero","Salario","Pago","Cuenta"],ph:"sah-LAH-ree-oh",ex:"Also 'sueldo' in everyday speech." },
    { type:"fillblank",q:"Trabajo de lunes a _____.",a:"viernes",o:["jueves","viernes","sábado","domingo"],ph:"vee-EHR-nehs",ex:"Monday through Friday: lunes, martes, miércoles, jueves, viernes." },
  ],
  6: [
    { type:"translate",q:"What time is it?",a:"¿Qué hora es?",o:["¿Qué hora es?","¿Qué día es?","¿Cuándo es?","¿Cómo estás?"],ph:"keh OH-rah ehs",ex:"Literally 'what hour is it?' Uses ser for time." },
    { type:"translate",q:"It's hot",a:"Hace calor",o:["Hace frío","Hace calor","Está lloviendo","Está nublado"],ph:"AH-seh kah-LOR",ex:"Weather uses 'hacer': hace calor, hace frío, hace sol." },
    { type:"fillblank",q:"Hoy es _____.",a:"martes",o:["enero","martes","verano","mañana"],ph:"MAR-tehs",ex:"Days of the week don't capitalize in Spanish." },
    { type:"translate",q:"Tomorrow",a:"Mañana",o:["Ayer","Hoy","Mañana","Ahora"],ph:"mahn-YAH-nah",ex:"Also means 'morning'. Context tells you which." },
    { type:"translate",q:"It's raining",a:"Está lloviendo",o:["Hace sol","Está lloviendo","Hace viento","Está nevando"],ph:"ehs-TAH yoh-vee-EHN-doh",ex:"Rain uses 'estar + gerund'. 'Llover' = to rain." },
    { type:"fillblank",q:"Son las _____ de la tarde.",a:"tres",o:["dos","tres","cinco","una"],ph:"TREHS",ex:"'Son las...' for plural hours. 'Es la una' for 1:00." },
    { type:"scenario",q:"Tell someone it's cold today:",a:"Hoy hace frío",o:["Hoy hace calor","Hoy hace frío","Hoy es bonito","Hoy está bien"],ph:"AH-seh FREE-oh",ex:"'Hace frío' = it makes cold. Spanish weather pattern." },
    { type:"translate",q:"Week",a:"Semana",o:["Día","Mes","Semana","Año"],ph:"seh-MAH-nah",ex:"'Esta semana' = this week. 'Fin de semana' = weekend." },
    { type:"translate",q:"Yesterday",a:"Ayer",o:["Hoy","Mañana","Ayer","Ahora"],ph:"ah-YEHR",ex:"Ayer = yesterday. Hoy = today. Mañana = tomorrow." },
    { type:"fillblank",q:"El _____ pasado fui al parque.",a:"domingo",o:["enero","verano","domingo","año"],ph:"doh-MEEN-goh",ex:"'Pasado' = last/past. 'El domingo pasado' = last Sunday." },
    { type:"translate",q:"Spring",a:"Primavera",o:["Verano","Primavera","Otoño","Invierno"],ph:"pree-mah-VEH-rah",ex:"Seasons: primavera, verano, otoño, invierno." },
    { type:"fillblank",q:"Hace mucho _____ afuera.",a:"viento",o:["sol","viento","agua","frío"],ph:"vee-EHN-toh",ex:"'Viento' = wind. 'Hace viento' = it's windy." },
    { type:"scenario",q:"Ask if it will rain tomorrow:",a:"¿Va a llover mañana?",o:["¿Hace frío mañana?","¿Va a llover mañana?","¿Qué hora es?","¿Es verano?"],ph:"vah ah yoh-VEHR mahn-YAH-nah",ex:"'Va a' = going to. Future with ir + a + infinitive." },
    { type:"translate",q:"Month",a:"Mes",o:["Día","Semana","Mes","Año"],ph:"MEHS",ex:"'Este mes' = this month. Months are lowercase in Spanish." },
    { type:"translate",q:"It's sunny",a:"Hace sol",o:["Hace calor","Hace sol","Está claro","Está bonito"],ph:"AH-seh SOHL",ex:"'Hace sol' = it makes sun. Standard weather expression." },
    { type:"fillblank",q:"En _____ hace mucho calor.",a:"verano",o:["invierno","verano","otoño","marzo"],ph:"veh-RAH-noh",ex:"'Verano' = summer. The hot season." },
    { type:"translate",q:"Cloudy",a:"Nublado",o:["Soleado","Nublado","Lluvioso","Ventoso"],ph:"noo-BLAH-doh",ex:"'Está nublado' = it's cloudy. Uses estar." },
    { type:"scenario",q:"Say the weather is nice:",a:"Hoy hace buen tiempo",o:["Hoy hace mal tiempo","Hoy hace buen tiempo","Está lloviendo","Hoy es frío"],ph:"AH-seh bwehn tee-EHM-poh",ex:"'Buen tiempo' = good weather. 'Mal tiempo' = bad weather." },
    { type:"translate",q:"At night",a:"En la noche",o:["En la mañana","En la tarde","En la noche","Al mediodía"],ph:"ehn lah NOH-cheh",ex:"Time of day: mañana, tarde, noche." },
    { type:"fillblank",q:"Los _____ no trabajo.",a:"sábados",o:["lunes","miércoles","viernes","sábados"],ph:"SAH-bah-dohs",ex:"'Los sábados' = on Saturdays. Plural = every Saturday." },
  ],
  7: [
    { type:"translate",q:"Mother",a:"Madre",o:["Padre","Madre","Hermana","Abuela"],ph:"MAH-dreh",ex:"Also 'mamá' casually. 'Madre' is more formal." },
    { type:"translate",q:"Brother",a:"Hermano",o:["Primo","Tío","Hermano","Hijo"],ph:"ehr-MAH-noh",ex:"'Hermana' = sister. 'Hermanos' can mean siblings." },
    { type:"fillblank",q:"Mi _____ tiene cuatro años.",a:"sobrino",o:["hermano","sobrino","abuelo","padre"],ph:"soh-BREE-noh",ex:"'Sobrino' = nephew. 'Sobrina' = niece." },
    { type:"translate",q:"Niece",a:"Sobrina",o:["Prima","Sobrina","Hija","Hermana"],ph:"soh-BREE-nah",ex:"Female version of 'sobrino'." },
    { type:"scenario",q:"Tell someone about your pets:",a:"Tengo dos perros",o:["Tengo un gato","Tengo dos perros","No tengo mascotas","Quiero un pájaro"],ph:"TEHN-goh dohs PEH-rrohs",ex:"'Perro' = dog, 'gato' = cat, 'mascota' = pet." },
    { type:"translate",q:"Grandfather",a:"Abuelo",o:["Padre","Tío","Abuelo","Primo"],ph:"ah-BWEH-loh",ex:"'Abuela' = grandmother. 'Abuelos' = grandparents." },
    { type:"translate",q:"Wife / Husband",a:"Esposa / Esposo",o:["Novia / Novio","Esposa / Esposo","Amiga / Amigo","Hermana / Hermano"],ph:"ehs-POH-sah / ehs-POH-soh",ex:"Formal. 'Mujer' (woman) and 'marido' (husband) also common." },
    { type:"translate",q:"Son / Daughter",a:"Hijo / Hija",o:["Primo / Prima","Hijo / Hija","Nieto / Nieta","Sobrino / Sobrina"],ph:"EE-hoh / EE-hah",ex:"'Hijos' = children. The 'h' is always silent in Spanish." },
    { type:"scenario",q:"Say you have a big family:",a:"Tengo una familia grande",o:["Mi familia es pequeña","Tengo una familia grande","No tengo familia","Vivo solo"],ph:"fah-MEE-lee-ah GRAHN-deh",ex:"'Grande' = big. 'Pequeña' = small." },
    { type:"fillblank",q:"Mi _____ cocina muy bien.",a:"abuela",o:["perro","abuela","carro","casa"],ph:"ah-BWEH-lah",ex:"'Cocina' = cooks/kitchen. Grandma cooks well — universal truth." },
    { type:"translate",q:"Cousin",a:"Primo",o:["Hermano","Primo","Tío","Sobrino"],ph:"PREE-moh",ex:"'Prima' = female cousin. 'Primos' = cousins." },
    { type:"translate",q:"Uncle",a:"Tío",o:["Abuelo","Primo","Tío","Padre"],ph:"TEE-oh",ex:"'Tía' = aunt. Also used as slang for 'dude' in Spain." },
    { type:"fillblank",q:"Mis _____ viven en Texas.",a:"padres",o:["amigos","padres","perros","jefes"],ph:"PAH-drehs",ex:"'Padres' = parents. 'Padre' = father." },
    { type:"scenario",q:"Introduce your sister:",a:"Ella es mi hermana",o:["Ella es mi madre","Ella es mi hermana","Ella es mi prima","Ella es mi amiga"],ph:"EH-yah ehs mee ehr-MAH-nah",ex:"Simple introduction. 'Ella es...' = she is..." },
    { type:"translate",q:"Grandchildren",a:"Nietos",o:["Hijos","Sobrinos","Nietos","Primos"],ph:"nee-EH-tohs",ex:"'Nieto' = grandson, 'nieta' = granddaughter." },
    { type:"fillblank",q:"Somos una familia muy _____.",a:"unida",o:["grande","unida","bonita","nueva"],ph:"oo-NEE-dah",ex:"'Unida' = close/united. Common way to describe family." },
    { type:"translate",q:"Girlfriend / Boyfriend",a:"Novia / Novio",o:["Esposa / Esposo","Novia / Novio","Amiga / Amigo","Mujer / Hombre"],ph:"NOH-vee-ah / NOH-vee-oh",ex:"Also means bride/groom depending on context." },
    { type:"scenario",q:"Say your nephew loves trucks:",a:"A mi sobrino le encantan los camiones",o:["Mi sobrino es grande","A mi sobrino le encantan los camiones","Tiene cuatro años","Vive conmigo"],ph:"leh ehn-KAHN-tahn lohs kah-mee-OH-nehs",ex:"'Encantar' = to love/enchant. 'Camiones' = trucks." },
    { type:"translate",q:"Twins",a:"Gemelos",o:["Hermanos","Gemelos","Primos","Amigos"],ph:"heh-MEH-lohs",ex:"'Gemelos' = twins. Also means cufflinks!" },
    { type:"fillblank",q:"Mi _____ favorita es la de Navidad.",a:"tradición",o:["comida","tradición","fiesta","familia"],ph:"trah-dee-see-OHN",ex:"'Tradición' = tradition. 'Navidad' = Christmas." },
  ],
  8: [
    { type:"translate",q:"To go",a:"Ir",o:["Ser","Ir","Ver","Dar"],ph:"EER",ex:"Irregular verb. Voy, vas, va, vamos, van." },
    { type:"translate",q:"To want",a:"Querer",o:["Poder","Querer","Deber","Saber"],ph:"keh-REHR",ex:"Stem-changing: quiero, quieres, quiere..." },
    { type:"fillblank",q:"Yo _____ ir al restaurante.",a:"quiero",o:["tengo","quiero","puedo","debo"],ph:"kee-EH-roh",ex:"'Quiero' + infinitive = I want to (do something)." },
    { type:"translate",q:"To know (a fact)",a:"Saber",o:["Conocer","Saber","Pensar","Creer"],ph:"sah-BEHR",ex:"'Saber' = know facts/how to. 'Conocer' = know people/places." },
    { type:"translate",q:"I can",a:"Yo puedo",o:["Yo quiero","Yo debo","Yo puedo","Yo sé"],ph:"yoh PWEH-doh",ex:"'Poder' = to be able to. Very useful verb." },
    { type:"fillblank",q:"Nosotros _____ al parque los domingos.",a:"vamos",o:["somos","vamos","tenemos","hacemos"],ph:"VAH-mohs",ex:"'Vamos' = we go. 'Ir a' = to go to." },
    { type:"translate",q:"To do / To make",a:"Hacer",o:["Decir","Hacer","Poner","Tener"],ph:"ah-SEHR",ex:"'Hago' = I do/make. Irregular in yo form." },
    { type:"scenario",q:"Say 'I need to work':",a:"Necesito trabajar",o:["Quiero trabajar","Necesito trabajar","Puedo trabajar","Debo trabajar"],ph:"neh-seh-SEE-toh trah-bah-HAR",ex:"'Necesitar' + infinitive = need to do something." },
    { type:"fillblank",q:"¿Tú _____ dónde está el banco?",a:"sabes",o:["conoces","sabes","quieres","puedes"],ph:"SAH-behs",ex:"'Sabes' = you know (a fact). 'Conoces' = you know (a person/place)." },
    { type:"translate",q:"To speak",a:"Hablar",o:["Escuchar","Hablar","Leer","Escribir"],ph:"ah-BLAR",ex:"Regular -ar verb. Hablo, hablas, habla, hablamos, hablan." },
    { type:"translate",q:"To eat",a:"Comer",o:["Beber","Comer","Cocinar","Pedir"],ph:"koh-MEHR",ex:"Regular -er verb. Como, comes, come, comemos, comen." },
    { type:"translate",q:"To sleep",a:"Dormir",o:["Descansar","Dormir","Soñar","Despertar"],ph:"dor-MEER",ex:"Stem-changing: duermo, duermes, duerme..." },
    { type:"fillblank",q:"Ella _____ español muy bien.",a:"habla",o:["sabe","habla","tiene","conoce"],ph:"AH-blah",ex:"'Habla' = she speaks. Regular conjugation." },
    { type:"scenario",q:"Say you don't understand:",a:"No entiendo",o:["No sé","No entiendo","No puedo","No quiero"],ph:"noh ehn-tee-EHN-doh",ex:"Essential survival phrase. Say it often while learning." },
    { type:"translate",q:"To give",a:"Dar",o:["Tomar","Dar","Poner","Traer"],ph:"DAR",ex:"Irregular: doy, das, da, damos, dan." },
    { type:"fillblank",q:"¿_____ venir conmigo?",a:"Puedes",o:["Sabes","Puedes","Quieres","Debes"],ph:"PWEH-dehs",ex:"'¿Puedes...?' = Can you...? Asking about ability." },
    { type:"translate",q:"To leave",a:"Salir",o:["Entrar","Salir","Llegar","Volver"],ph:"sah-LEER",ex:"'Salgo' = I leave (irregular yo form). 'Sales' = you leave." },
    { type:"translate",q:"To bring",a:"Traer",o:["Llevar","Traer","Dar","Poner"],ph:"trah-EHR",ex:"'Traer' = bring here. 'Llevar' = take there." },
    { type:"scenario",q:"Ask for help:",a:"¿Me puedes ayudar?",o:["¿Me puedes dar?","¿Me puedes ayudar?","¿Me puedes decir?","¿Me puedes llevar?"],ph:"meh PWEH-dehs ah-yoo-DAR",ex:"'Ayudar' = to help. Very polite way to ask." },
    { type:"fillblank",q:"Voy a _____ temprano mañana.",a:"salir",o:["dormir","salir","comer","trabajar"],ph:"sah-LEER",ex:"'Voy a salir' = I'm going to leave. Near future tense." },
  ],
  9: [
    { type:"scenario",q:"Meet someone new at a party:",a:"¡Hola! ¿Cómo te llamas?",o:["¡Adiós!","¡Hola! ¿Cómo te llamas?","¿Cuánto cuesta?","Tengo hambre"],ph:"KOH-moh teh YAH-mahs",ex:"Natural opener. 'How do you call yourself?'" },
    { type:"fillblank",q:"¿De dónde _____?",a:"eres",o:["estás","eres","tienes","vas"],ph:"EH-rehs",ex:"Asking where someone is FROM = ser (permanent)." },
    { type:"scenario",q:"Someone asks what you do:",a:"Trabajo en el gobierno. Soy gerente.",o:["No sé","Trabajo en el gobierno. Soy gerente.","Soy estudiante","No trabajo"],ph:"trah-BAH-hoh ehn ehl goh-bee-EHR-noh",ex:"Two sentences: what you do + your title. Natural flow." },
    { type:"translate",q:"I like it a lot",a:"Me gusta mucho",o:["Me gusta mucho","No me gusta","Me encanta","Está bien"],ph:"meh GOOS-tah MOO-choh",ex:"'Gustar' works backwards: 'it pleases me' = I like it." },
    { type:"fillblank",q:"¿_____ gustó la comida?",a:"Te",o:["Me","Te","Le","Se"],ph:"teh",ex:"'¿Te gustó?' = Did you like it? Past tense of gustar." },
    { type:"scenario",q:"Find the bathroom:",a:"Disculpa, ¿dónde está el baño?",o:["Necesito agua","Disculpa, ¿dónde está el baño?","Quiero irme","Estoy cansado"],ph:"DOHN-deh ehs-TAH ehl BAHN-yoh",ex:"Survival Spanish #1. 'Baño' = bathroom." },
    { type:"translate",q:"See you later",a:"Nos vemos",o:["Adiós","Hasta luego","Nos vemos","Buenas noches"],ph:"nohs VEH-mohs",ex:"Literally 'we see each other'. Casual and friendly." },
    { type:"fillblank",q:"Fue un _____ conocerte.",a:"placer",o:["gusto","placer","bueno","grande"],ph:"plah-SEHR",ex:"'Un placer' = a pleasure. Slightly more formal than 'mucho gusto'." },
    { type:"scenario",q:"Ask for their number:",a:"¿Me das tu número?",o:["¿Cómo te llamas?","¿Me das tu número?","¿Dónde vives?","¿Tienes carro?"],ph:"meh dahs too NOO-meh-roh",ex:"'¿Me das...?' = Will you give me...? Casual and direct." },
    { type:"translate",q:"Let's go!",a:"¡Vamos!",o:["¡Espera!","¡Vamos!","¡Para!","¡Corre!"],ph:"VAH-mohs",ex:"One of the most used words. Works as 'let's go' and 'come on'." },
    { type:"scenario",q:"Say you're learning Spanish:",a:"Estoy aprendiendo español",o:["Hablo español","Estoy aprendiendo español","No hablo español","Sé un poco"],ph:"ehs-TOY ah-prehn-dee-EHN-doh",ex:"Present progressive: estoy + -iendo. Shows ongoing action." },
    { type:"fillblank",q:"¿Quieres ir a _____ algo?",a:"tomar",o:["hacer","tomar","ver","dar"],ph:"toh-MAR",ex:"'Tomar algo' = to have a drink. Common social invitation." },
    { type:"translate",q:"What do you think?",a:"¿Qué piensas?",o:["¿Qué quieres?","¿Qué piensas?","¿Qué haces?","¿Qué dices?"],ph:"keh pee-EHN-sahs",ex:"'Pensar' = to think. Great conversation driver." },
    { type:"scenario",q:"Compliment someone's cooking:",a:"¡Esto está delicioso!",o:["Está bien","¡Esto está delicioso!","Tengo hambre","Quiero más"],ph:"EHS-toh ehs-TAH deh-lee-see-OH-soh",ex:"'Esto' = this. Complimenting food makes friends fast." },
    { type:"translate",q:"I agree",a:"Estoy de acuerdo",o:["Yo creo que sí","Estoy de acuerdo","Tienes razón","Claro que sí"],ph:"ehs-TOY deh ah-KWEHR-doh",ex:"Literally 'I am in agreement'. Very common phrase." },
    { type:"fillblank",q:"La pasé muy _____ anoche.",a:"bien",o:["mal","bien","grande","mucho"],ph:"bee-EHN",ex:"'La pasé bien' = I had a good time. 'Anoche' = last night." },
    { type:"scenario",q:"Say goodbye after a great time:",a:"La pasé increíble, gracias.",o:["Adiós","La pasé increíble, gracias.","Buenas noches","Hasta mañana"],ph:"lah pah-SEH een-kreh-EE-bleh",ex:"'Increíble' = incredible. Warm and genuine farewell." },
    { type:"translate",q:"Of course!",a:"¡Claro que sí!",o:["¡Tal vez!","¡Claro que sí!","¡No sé!","¡Quién sabe!"],ph:"KLAH-roh keh SEE",ex:"'Claro' = clear/of course. Emphatic agreement." },
    { type:"fillblank",q:"Vamos a _____ este fin de semana.",a:"salir",o:["trabajar","salir","dormir","estudiar"],ph:"sah-LEER",ex:"'Salir' = to go out. Weekend plans." },
    { type:"scenario",q:"Invite someone to hang out:",a:"¿Quieres salir este fin de semana?",o:["¿Tienes tiempo?","¿Quieres salir este fin de semana?","¿Vas a trabajar?","¿Dónde vives?"],ph:"kee-EH-rehs sah-LEER EHS-teh feen deh seh-MAH-nah",ex:"Direct and casual invitation. Natural way to make plans." },
  ],
  10: [
    { type:"translate",q:"What's up? (PR)",a:"¿Qué lo que?",o:["¿Cómo estás?","¿Qué tal?","¿Qué lo que?","¿Qué pasa?"],ph:"keh loh keh",ex:"Purely Caribbean. You won't hear this in Mexico." },
    { type:"translate",q:"Awesome! (PR)",a:"¡Wepa!",o:["¡Oye!","¡Wepa!","¡Mira!","¡Dale!"],ph:"WEH-pah",ex:"Puerto Rican exclamation of excitement. Like 'yay!' but cooler." },
    { type:"fillblank",q:"Esa canción está _____. (amazing)",a:"brutal",o:["buena","brutal","bonita","grande"],ph:"broo-TAHL",ex:"In Caribbean Spanish, 'brutal' = amazing/awesome. Not violent." },
    { type:"translate",q:"Let's go (Caribbean)",a:"¡Dale!",o:["¡Vamos!","¡Dale!","¡Espera!","¡Corre!"],ph:"DAH-leh",ex:"Pitbull made it famous but it's everyday Caribbean speech." },
    { type:"scenario",q:"Friend shows you great food:",a:"¡Wepa! Eso se ve brutal, mano",o:["Está bueno","¡Wepa! Eso se ve brutal, mano","Quiero comer","Gracias"],ph:"WEH-pah EH-soh seh veh broo-TAHL MAH-noh",ex:"Stacking slang: wepa (wow) + brutal (amazing) + mano (bro)." },
    { type:"translate",q:"Dude / Bro (PR)",a:"Mano",o:["Amigo","Hermano","Mano","Señor"],ph:"MAH-noh",ex:"Short for 'hermano'. Universal Caribbean bro term." },
    { type:"fillblank",q:"Estoy más cansao que un _____.",a:"perro",o:["gato","perro","niño","viejo"],ph:"PEH-rroh",ex:"Caribbean exaggeration. 'More tired than a dog.' Note: 'cansao' drops the 'd' from 'cansado'." },
    { type:"translate",q:"Don't mess with me (PR)",a:"No me jodas",o:["Déjame en paz","No me jodas","No me hables","Vete de aquí"],ph:"noh meh HOH-dahs",ex:"Informal/vulgar. Only with close friends. Strong language." },
    { type:"scenario",q:"Greet your PR friend casually:",a:"¡Qué lo que, pana! ¿Cómo andas?",o:["Buenos días, señor","¡Qué lo que, pana! ¿Cómo andas?","Hola, ¿cómo estás?","¿Qué tal?"],ph:"keh loh keh PAH-nah KOH-moh AHN-dahs",ex:"Full Caribbean greeting: 'what's up, buddy, how you doing?'" },
    { type:"translate",q:"That's a mess (PR)",a:"¡Qué relajo!",o:["¡Qué problema!","¡Qué relajo!","¡Qué lío!","¡Qué horror!"],ph:"keh reh-LAH-hoh",ex:"'Relajo' = mess/chaos/disorder. Very Puerto Rican." },
    { type:"fillblank",q:"Todo bien, gracias a _____.",a:"Dios",o:["ti","Dios","todos","mí"],ph:"dee-OHS",ex:"'Gracias a Dios' = thank God. Very common Caribbean response." },
    { type:"translate",q:"Buddy (PR)",a:"Pana",o:["Amigo","Pana","Mano","Compa"],ph:"PAH-nah",ex:"Puerto Rican for friend/buddy. 'Mano' and 'pana' are interchangeable." },
    { type:"scenario",q:"React to surprising news PR style:",a:"¡No me digas! ¿De verdad?",o:["¿En serio?","¡No me digas! ¿De verdad?","Wow","Interesante"],ph:"noh meh DEE-gahs deh vehr-DAHD",ex:"'No me digas' = don't tell me! Classic PR reaction." },
    { type:"translate",q:"Everything chill",a:"Todo tranquilo",o:["Todo bien","Todo tranquilo","Todo bueno","Todo normal"],ph:"TOH-doh trahn-KEE-loh",ex:"Caribbean chill. 'Todo tranqui' is even more casual." },
    { type:"fillblank",q:"Eso está bien _____.",a:"cabrón",o:["bueno","cabrón","loco","fuerte"],ph:"kah-BROHN",ex:"Vulgar but common. Means 'crazy good' in this context. Use with friends only." },
    { type:"translate",q:"The thing is...",a:"Es que...",o:["Mira...","Es que...","Bueno...","O sea..."],ph:"ehs keh",ex:"The #1 filler phrase. Natural way to explain or excuse." },
    { type:"scenario",q:"Party was amazing. Tell your friend:",a:"¡Mano, la fiesta estuvo brutal! ¡Wepa!",o:["Estuvo bien","¡Mano, la fiesta estuvo brutal! ¡Wepa!","Me gustó","Fue divertido"],ph:"MAH-noh lah fee-EHS-tah ehs-TOO-voh broo-TAHL WEH-pah",ex:"Full Caribbean hype. 'Estuvo' = it was (estar, past tense)." },
    { type:"translate",q:"Dang! (PR)",a:"¡Diache!",o:["¡Caramba!","¡Diache!","¡Ay!","¡Oye!"],ph:"dee-AH-cheh",ex:"Clean exclamation. Puerto Rican version of 'damn'." },
    { type:"fillblank",q:"Vamos a janguear este _____.",a:"fin de semana",o:["día","fin de semana","momento","rato"],ph:"hahn-geh-AHR",ex:"'Janguear' comes from English 'hang out'. Spanglish at its finest." },
    { type:"translate",q:"To hang out (PR)",a:"Janguear",o:["Salir","Janguear","Pasear","Caminar"],ph:"hahn-geh-AHR",ex:"Borrowed from English. Only used in Caribbean Spanish." },
  ],
  11: [
    { type:"translate",q:"You're messing with me (PR)",a:"Me estás gufando",o:["Me estás mintiendo","Me estás gufando","Me estás molestando","Me estás hablando"],ph:"meh ehs-TAHS goo-FAHN-doh",ex:"'Gufar' = to joke/mess around. Puerto Rican slang." },
    { type:"fillblank",q:"Tengo _____ años esperando.",a:"mil",o:["diez","cien","mil","muchos"],ph:"MEEL",ex:"Caribbean exaggeration. 'I've been waiting a thousand years.'" },
    { type:"translate",q:"That song is a hit",a:"Esa canción está pegá",o:["Es buena","Esa canción está pegá","Me gusta","Es nueva"],ph:"ehs-TAH peh-GAH",ex:"'Pegá' = stuck/hit. Dropped 'd' from 'pegada' — classic Caribbean." },
    { type:"scenario",q:"Friend is late. React Caribbean:",a:"¡Mano, tengo mil años esperando!",o:["Llegas tarde","¡Mano, tengo mil años esperando!","No importa","Está bien"],ph:"TEHN-goh meel AHN-yohs",ex:"Dramatic exaggeration is a Caribbean art form." },
    { type:"fillblank",q:"El tráfico estaba al _____.",a:"garete",o:["máximo","garete","fuego","diablo"],ph:"gah-REH-teh",ex:"'Al garete' = out of control. Pure Puerto Rican expression." },
    { type:"translate",q:"Play that song (PR)",a:"Ponme esa canción",o:["Escucha esa canción","Ponme esa canción","Canta esa canción","Busca esa canción"],ph:"POHN-meh EH-sah kahn-see-OHN",ex:"'Ponme' = put on for me. Direct and casual." },
    { type:"translate",q:"Part of the crew",a:"Parte del corillo",o:["Parte del grupo","Parte del corillo","Parte del equipo","Parte del barrio"],ph:"PAR-teh dehl koh-REE-yoh",ex:"'Corillo' = crew/squad. Your inner circle." },
    { type:"scenario",q:"Hype up friend's cooking:",a:"¡Diache! Cocinas con sazón",o:["Está bueno","¡Diache! Cocinas con sazón","Gracias","Me gusta"],ph:"dee-AH-cheh koh-SEE-nahs kohn sah-SOHN",ex:"'Sazón' = seasoning/flavor. Highest cooking compliment." },
    { type:"fillblank",q:"Mira el _____ que tiene este tipo.",a:"show",o:["problema","show","relajo","drama"],ph:"SHOH",ex:"Borrowed English word. 'Look at the spectacle this guy is making.'" },
    { type:"translate",q:"Out of control (PR)",a:"Al garete",o:["Al máximo","Al garete","Al fuego","Al diablo"],ph:"ahl gah-REH-teh",ex:"Nautical origin — a ship drifting without control." },
    { type:"scenario",q:"Joke about your Spanish:",a:"Mi español es un desastre, pero aquí estamos",o:["Hablo bien","Mi español es un desastre, pero aquí estamos","No sé nada","Estoy aprendiendo"],ph:"oon deh-SAHS-treh PEH-roh ah-KEE ehs-TAH-mohs",ex:"Self-deprecating humor = the Caribbean way to connect." },
    { type:"fillblank",q:"Bad Bunny es _____.",a:"brutal",o:["bueno","brutal","famoso","grande"],ph:"broo-TAHL",ex:"Using 'brutal' to describe Bad Bunny is peak Caribbean." },
    { type:"translate",q:"Seasoning / Flavor",a:"Sazón",o:["Sal","Sazón","Sabor","Salsa"],ph:"sah-SOHN",ex:"'Sazón' = the magic touch in cooking. Also a metaphor for style." },
    { type:"scenario",q:"Traffic was insane:",a:"¡El tráfico estaba al garete!",o:["Había tráfico","¡El tráfico estaba al garete!","Estaba mal","No pude llegar"],ph:"ehl TRAH-fee-koh ehs-TAH-bah ahl gah-REH-teh",ex:"'Estaba' = it was (ongoing past). Perfect for complaining." },
    { type:"fillblank",q:"¿Dónde tú _____ anoche?",a:"estabas",o:["eras","estabas","fuiste","ibas"],ph:"ehs-TAH-bahs",ex:"Caribbean word order: '¿Dónde tú estabas?' instead of '¿Dónde estabas tú?'" },
    { type:"translate",q:"I'm dying of hunger",a:"Me muero de hambre",o:["Tengo hambre","Me muero de hambre","Quiero comer","Necesito comida"],ph:"meh MWEH-roh deh AHM-breh",ex:"Dramatic exaggeration. You're not actually dying. Probably." },
    { type:"translate",q:"Look at this spectacle!",a:"¡Mira el show!",o:["¡Mira esto!","¡Mira el show!","¡Mira allá!","¡Mira quién llegó!"],ph:"MEE-rah ehl SHOH",ex:"English loanword 'show' used in Caribbean Spanish." },
    { type:"scenario",q:"Confirm you're coming, PR style:",a:"¡Dale! Llego en un ratito",o:["Sí, voy","¡Dale! Llego en un ratito","Está bien","Voy para allá"],ph:"DAH-leh YEH-goh ehn oon rah-TEE-toh",ex:"'Dale' = do it/let's go. 'Ratito' = a little while (diminutive)." },
    { type:"fillblank",q:"Ahora eres parte del _____.",a:"corillo",o:["grupo","corillo","equipo","barrio"],ph:"koh-REE-yoh",ex:"Welcome to the crew. You've arrived." },
    { type:"translate",q:"A little while",a:"Un ratito",o:["Un momento","Un ratito","Un segundo","Un rato"],ph:"oon rah-TEE-toh",ex:"Diminutive of 'rato'. Could mean 5 min or 2 hours — Caribbean time." },
  ],
};

// ═══════════ GERMAN QUESTIONS ═══════════
const DE_Q = {
  0: [
    { type:"translate",q:"The letter 'ü' sounds like...",a:"'oo' with pursed lips",o:["'oo' with pursed lips","'uh' like 'up'","'ee' like 'see'","'ah' like 'father'"],ph:"ü = round your lips for 'oo', say 'ee'",ex:"German has umlauts (ä, ö, ü) that English doesn't have." },
    { type:"translate",q:"The letter 'ö' sounds like...",a:"'ur' as in 'burn'",o:["'oh' as in 'go'","'ur' as in 'burn'","'oo' as in 'food'","'or' as in 'more'"],ph:"ö = round your lips for 'oh', say 'eh'",ex:"Think of the sound in 'burn' or 'bird' — that's close to ö." },
    { type:"translate",q:"The 'ch' in 'ich' sounds like...",a:"A soft hiss (like a cat)",o:["'k' as in 'kick'","A soft hiss (like a cat)","'sh' as in 'ship'","'ch' as in 'church'"],ph:"ich = eesh (soft hiss)",ex:"German 'ch' after e/i is a soft palatal sound, not English 'ch'." },
    { type:"translate",q:"The 'w' in German sounds like...",a:"English 'v'",o:["English 'w'","English 'v'","English 'f'","Silent"],ph:"w = v sound",ex:"'Wasser' (water) = VAH-ser. German W always = English V." },
    { type:"fillblank",q:"The German word 'Straße' has the letter 'ß' which sounds like _____.",a:"'ss'",o:["'sh'","'ss'","'ts'","'z'"],ph:"ß = ss",ex:"'ß' (Eszett) is just a sharp S. 'Straße' = SHTRAH-seh." },
    { type:"translate",q:"The 'z' in German sounds like...",a:"'ts' as in 'cats'",o:["'z' as in 'zoo'","'s' as in 'see'","'ts' as in 'cats'","'th' as in 'the'"],ph:"z = ts",ex:"'Zeit' (time) = TSAIT. Always 'ts', never English 'z'." },
    { type:"translate",q:"The 'j' in German sounds like...",a:"English 'y'",o:["English 'j'","English 'y'","English 'h'","English 'g'"],ph:"j = y sound",ex:"'Ja' (yes) = YAH. German J = English Y." },
    { type:"translate",q:"The 'ei' combination sounds like...",a:"'eye'",o:["'ee'","'eye'","'ay'","'oy'"],ph:"ei = eye",ex:"'Mein' = MINE. 'Nein' = NINE. Think 'eye'." },
    { type:"translate",q:"The 'ie' combination sounds like...",a:"'ee' as in 'see'",o:["'eye'","'ee' as in 'see'","'eh'","'uh'"],ph:"ie = ee",ex:"'Bier' = BEER. Opposite of 'ei'. Remember: the SECOND letter wins." },
    { type:"fillblank",q:"'Sch' in German sounds like _____ in English.",a:"'sh'",o:["'sk'","'sh'","'sch'","'ch'"],ph:"sch = sh",ex:"'Schule' (school) = SHOO-leh. Always 'sh'." },
    { type:"translate",q:"The 'v' in German sounds like...",a:"English 'f'",o:["English 'v'","English 'f'","English 'w'","English 'b'"],ph:"v = f sound",ex:"'Vater' (father) = FAH-ter. German V usually = English F." },
    { type:"translate",q:"How do you say 'ä'?",a:"'eh' as in 'bed'",o:["'ah' as in 'father'","'ay' as in 'say'","'eh' as in 'bed'","'ee' as in 'see'"],ph:"ä = eh",ex:"'Mädchen' (girl) = MEHD-shen." },
    { type:"scenario",q:"Your friend says a German word with 'eu'. How does it sound?",a:"'oy' as in 'boy'",o:["'oo' as in 'you'","'eh-oo'","'oy' as in 'boy'","'ew' as in 'few'"],ph:"eu = oy",ex:"'Deutsch' = DOYTSH. 'Freund' = FROYNT." },
    { type:"translate",q:"The 'r' in German is...",a:"Rolled or guttural (back of throat)",o:["Same as English","Rolled or guttural (back of throat)","Silent","Trilled with the tongue"],ph:"r = back of throat",ex:"German R is gargled, not the English R." },
    { type:"fillblank",q:"'sp' at the start of a German word sounds like _____.",a:"'shp'",o:["'sp'","'shp'","'zp'","'fp'"],ph:"sp = shp",ex:"'Sprechen' (to speak) = SHPREH-shen. Same with 'st' → 'sht'." },
    { type:"translate",q:"'st' at the start of a word sounds like...",a:"'sht'",o:["'st'","'sht'","'zt'","'tsh'"],ph:"st = sht",ex:"'Straße' = SHTRAH-seh. 'Studieren' = SHTOO-dee-ren." },
    { type:"scenario",q:"You see 'Entschuldigung'. Break it down:",a:"Ent-shool-dee-goong",o:["Ent-skul-di-gung","Ent-shool-dee-goong","En-chul-di-gun","Ent-sul-di-gung"],ph:"ehnt-SHOOL-dee-goong",ex:"It means 'excuse me'. Long but very common. You'll say it a lot." },
    { type:"translate",q:"How do you pronounce 'ch' after a, o, u?",a:"Like clearing your throat",o:["Like English 'k'","Like a soft hiss","Like clearing your throat","Like English 'sh'"],ph:"ach = throat clear",ex:"'Buch' (book) = BOOKH (guttural). Different from 'ich' (soft hiss)." },
    { type:"fillblank",q:"German has _____ grammatical genders.",a:"three",o:["two","three","four","one"],ph:"drei = dry",ex:"Der (masculine), die (feminine), das (neuter). You just have to memorize them." },
    { type:"translate",q:"All German nouns are...",a:"Capitalized",o:["Lowercase","Capitalized","Italicized","Abbreviated"],ph:"n/a",ex:"Every noun is capitalized in German. 'der Hund' = the dog." },
  ],
  1: [
    { type:"translate",q:"Hello (formal)",a:"Guten Tag",o:["Guten Tag","Tschüss","Danke","Bitte"],ph:"GOO-ten TAHG",ex:"Literally 'good day'. The standard formal greeting." },
    { type:"translate",q:"Hello (casual)",a:"Hallo",o:["Hallo","Auf Wiedersehen","Danke","Guten Morgen"],ph:"HAH-loh",ex:"Same as English 'hello'. Universal casual greeting." },
    { type:"translate",q:"Good morning",a:"Guten Morgen",o:["Guten Morgen","Guten Abend","Gute Nacht","Guten Tag"],ph:"GOO-ten MOR-gen",ex:"'Morgen' also means 'tomorrow'. Context makes it clear." },
    { type:"fillblank",q:"Guten _____, wie geht's?",a:"Tag",o:["Tag","Morgen","Abend","Nacht"],ph:"TAHG",ex:"'Wie geht's?' = How's it going? The most common follow-up." },
    { type:"translate",q:"Goodbye (formal)",a:"Auf Wiedersehen",o:["Tschüss","Auf Wiedersehen","Hallo","Danke"],ph:"owf VEE-der-zay-en",ex:"Literally 'until seeing again'. Very formal." },
    { type:"scenario",q:"You enter a bakery in the morning:",a:"Guten Morgen!",o:["Gute Nacht!","Guten Morgen!","Tschüss!","Auf Wiedersehen!"],ph:"GOO-ten MOR-gen",ex:"Morning greeting — polite and expected when entering shops." },
    { type:"translate",q:"Thank you",a:"Danke",o:["Bitte","Danke","Ja","Nein"],ph:"DAHN-keh",ex:"'Danke schön' = thank you very much." },
    { type:"translate",q:"Please / You're welcome",a:"Bitte",o:["Danke","Bitte","Ja","Entschuldigung"],ph:"BIH-teh",ex:"'Bitte' does double duty: please AND you're welcome." },
    { type:"fillblank",q:"Wie _____ Sie?",a:"heißen",o:["heißen","sind","haben","gehen"],ph:"HY-sen",ex:"'Wie heißen Sie?' = What's your name? (formal). Literally 'how are you called?'" },
    { type:"scenario",q:"Someone holds the door. You say:",a:"Danke!",o:["Bitte!","Danke!","Hallo!","Tschüss!"],ph:"DAHN-keh",ex:"Quick thanks. 'Danke' for thanks, 'bitte' for please." },
    { type:"translate",q:"Yes / No",a:"Ja / Nein",o:["Ja / Nein","Da / Net","Si / No","Oui / Non"],ph:"YAH / NINE",ex:"'Nein' sounds like English 'nine'. Don't mix them up!" },
    { type:"translate",q:"Excuse me",a:"Entschuldigung",o:["Entschuldigung","Danke","Bitte","Hallo"],ph:"ehnt-SHOOL-dee-goong",ex:"Long word but essential. Also shortened to 'Entschuldigen Sie'." },
    { type:"fillblank",q:"Ich _____ Maria.",a:"heiße",o:["bin","heiße","habe","gehe"],ph:"HY-seh",ex:"'Ich heiße...' = I'm called... Standard self-introduction." },
    { type:"translate",q:"Good evening",a:"Guten Abend",o:["Guten Morgen","Guten Tag","Guten Abend","Gute Nacht"],ph:"GOO-ten AH-bent",ex:"Used after about 6pm." },
    { type:"scenario",q:"You leave a friend's house:",a:"Tschüss!",o:["Guten Tag!","Tschüss!","Entschuldigung!","Danke!"],ph:"CHOOS",ex:"Casual goodbye. Like 'bye!' in English." },
    { type:"translate",q:"How are you? (casual)",a:"Wie geht's?",o:["Wie heißen Sie?","Wie geht's?","Was ist das?","Wo bist du?"],ph:"vee GAYTS",ex:"Short for 'Wie geht es dir?' The everyday check-in." },
    { type:"fillblank",q:"Mir geht es _____. (I'm doing well)",a:"gut",o:["schlecht","gut","so","lala"],ph:"GOOT",ex:"'Gut' = good. 'Schlecht' = bad. 'Es geht' = so-so." },
    { type:"translate",q:"I don't understand",a:"Ich verstehe nicht",o:["Ich weiß nicht","Ich verstehe nicht","Ich spreche nicht","Ich kann nicht"],ph:"eesh fehr-SHTAY-eh nisht",ex:"Your #1 survival phrase in Germany. Say it proudly." },
    { type:"scenario",q:"Meet someone new. Introduce yourself:",a:"Hallo, ich heiße... Freut mich!",o:["Tschüss!","Hallo, ich heiße... Freut mich!","Gute Nacht!","Auf Wiedersehen!"],ph:"FROYHT meesh",ex:"'Freut mich' = pleased to meet you. Literally 'makes me happy'." },
    { type:"translate",q:"I'm sorry",a:"Es tut mir leid",o:["Es tut mir leid","Entschuldigung","Danke schön","Bitte sehr"],ph:"ehs TOOT meer LIED",ex:"Literally 'it does me sorrow'. For genuine apologies." },
  ],
  2: [
    { type:"translate",q:"Water",a:"Wasser",o:["Milch","Wasser","Saft","Kaffee"],ph:"VAH-ser",ex:"Same root as English 'water'. Easy to remember." },
    { type:"translate",q:"Bread",a:"Brot",o:["Brot","Reis","Fleisch","Käse"],ph:"BROHT",ex:"Germany has 3,000+ types of bread. They take it seriously." },
    { type:"fillblank",q:"Ich möchte einen _____, bitte.",a:"Kaffee",o:["Kaffee","Tisch","Stuhl","Teller"],ph:"KAH-fay",ex:"'Möchte' = would like. Polite way to order." },
    { type:"scenario",q:"Order a beer in Germany:",a:"Ein Bier, bitte",o:["Einen Kaffee, bitte","Ein Bier, bitte","Wasser, bitte","Die Rechnung, bitte"],ph:"ine BEER BIH-teh",ex:"'Ein' = a/one. Germany = beer culture." },
    { type:"translate",q:"I'm hungry",a:"Ich habe Hunger",o:["Ich bin Hunger","Ich habe Hunger","Ich will Hunger","Ich mache Hunger"],ph:"eesh HAH-beh HOONG-er",ex:"German says 'I HAVE hunger' like Spanish. Not 'I am hungry'." },
    { type:"translate",q:"Breakfast",a:"Frühstück",o:["Mittagessen","Frühstück","Abendessen","Snack"],ph:"FROO-shtook",ex:"'Früh' = early, 'Stück' = piece. The early piece (of the day)." },
    { type:"translate",q:"Chicken",a:"Hähnchen",o:["Schwein","Hähnchen","Rind","Fisch"],ph:"HAYN-shen",ex:"Also 'Huhn' for the animal. 'Hähnchen' is the meat." },
    { type:"fillblank",q:"Die Suppe ist sehr _____.",a:"heiß",o:["kalt","heiß","groß","gut"],ph:"HICE",ex:"'Heiß' = hot. 'Kalt' = cold. 'ß' = ss sound." },
    { type:"scenario",q:"Ask for the check:",a:"Die Rechnung, bitte",o:["Die Speisekarte, bitte","Die Rechnung, bitte","Mehr Wasser, bitte","Das Essen, bitte"],ph:"dee REHKH-noong BIH-teh",ex:"'Rechnung' = bill/check. Add 'bitte' (please) always." },
    { type:"translate",q:"Delicious",a:"Lecker",o:["Heiß","Kalt","Lecker","Scharf"],ph:"LEH-ker",ex:"'Das ist lecker!' = That's delicious! Very common compliment." },
    { type:"translate",q:"I'm thirsty",a:"Ich habe Durst",o:["Ich habe Hunger","Ich habe Durst","Ich bin Durst","Ich will trinken"],ph:"eesh HAH-beh DOORST",ex:"Same 'have' pattern: 'Ich habe Durst' = I have thirst." },
    { type:"fillblank",q:"Ich möchte das _____ bestellen.",a:"Hähnchen",o:["Tisch","Hähnchen","Glas","Messer"],ph:"HAYN-shen beh-SHTEH-len",ex:"'Bestellen' = to order. 'Möchte' = would like." },
    { type:"translate",q:"The menu",a:"Die Speisekarte",o:["Die Rechnung","Die Speisekarte","Der Teller","Das Glas"],ph:"dee SHPY-zeh-kar-teh",ex:"'Speise' = food, 'Karte' = card. The food card." },
    { type:"scenario",q:"Say you don't eat pork:",a:"Ich esse kein Schweinefleisch",o:["Ich habe keinen Hunger","Ich esse kein Schweinefleisch","Ich möchte kein Dessert","Ich trinke kein Bier"],ph:"eesh EH-seh kine SHVY-neh-flysh",ex:"'Schweinefleisch' = pork (literally pig meat). Important dietary phrase." },
    { type:"translate",q:"Cheese",a:"Käse",o:["Brot","Käse","Butter","Wurst"],ph:"KAY-zeh",ex:"German cheese is excellent. 'Käsekuchen' = cheesecake." },
    { type:"translate",q:"Coffee",a:"Kaffee",o:["Tee","Kaffee","Saft","Milch"],ph:"KAH-fay",ex:"'Kaffee und Kuchen' (coffee and cake) = German afternoon tradition." },
    { type:"fillblank",q:"Kann ich die _____ sehen?",a:"Speisekarte",o:["Rechnung","Speisekarte","Küche","Toilette"],ph:"SHPY-zeh-kar-teh ZAY-en",ex:"'Kann ich...sehen?' = Can I see...? Polite way to ask for the menu." },
    { type:"translate",q:"Spicy",a:"Scharf",o:["Süß","Salzig","Scharf","Sauer"],ph:"SHARF",ex:"'Scharf' also means 'sharp'. Dual meaning." },
    { type:"scenario",q:"Compliment the food:",a:"Das schmeckt sehr gut!",o:["Es ist okay","Das schmeckt sehr gut!","Ich habe Hunger","Mehr, bitte"],ph:"dahs SHMEHKT zayr GOOT",ex:"'Schmecken' = to taste. 'Sehr gut' = very good." },
    { type:"translate",q:"Dessert",a:"Nachtisch",o:["Vorspeise","Nachtisch","Hauptgericht","Beilage"],ph:"NAHKH-tish",ex:"Literally 'after table'. 'Vorspeise' = appetizer." },
  ],
  // Levels 3-9 follow same pattern — abbreviated for file size
  3: [
    { type:"translate",q:"One",a:"Eins",o:["Eins","Zwei","Drei","Zehn"],ph:"EINSS",ex:"German numbers: eins, zwei, drei, vier, fünf..." },
    { type:"translate",q:"Twenty",a:"Zwanzig",o:["Zwölf","Fünfzehn","Zwanzig","Dreißig"],ph:"TSVAHN-tsig",ex:"German numbers 13-19 end in '-zehn'. 20 = zwanzig." },
    { type:"translate",q:"One hundred",a:"Hundert",o:["Zehn","Tausend","Hundert","Fünfzig"],ph:"HOON-dert",ex:"'Hundert' = hundred. 'Tausend' = thousand." },
    { type:"fillblank",q:"Ich bin _____ Jahre alt. (35)",a:"fünfunddreißig",o:["fünfundzwanzig","fünfunddreißig","vierzig","fünfzehn"],ph:"FOONF-oont-DRY-sig",ex:"German says numbers backwards: five-and-thirty = 35." },
    { type:"translate",q:"How much does it cost?",a:"Wie viel kostet das?",o:["Wie spät ist es?","Wie viel kostet das?","Wo ist das?","Wie viele gibt es?"],ph:"vee FEEL KOS-tet dahs",ex:"'Wie viel' = how much. Essential shopping phrase." },
    { type:"fillblank",q:"Das kostet _____ Euro. (€50)",a:"fünfzig",o:["fünfzehn","fünfzig","fünfhundert","fünf"],ph:"FOONF-tsig",ex:"50 = fünfzig. 15 = fünfzehn. 500 = fünfhundert." },
    { type:"translate",q:"First",a:"Erste",o:["Zweite","Erste","Letzte","Dritte"],ph:"EHR-steh",ex:"Erste, zweite, dritte = first, second, third." },
    { type:"scenario",q:"Someone asks your age. You're 30:",a:"Ich bin dreißig Jahre alt",o:["Ich bin dreizehn","Ich bin dreißig Jahre alt","Ich bin drei","Ich bin dreihundert"],ph:"eesh bin DRY-sig YAH-reh ahlt",ex:"'Jahre alt' = years old. Always include both words." },
    { type:"translate",q:"Half",a:"Halb",o:["Ganz","Halb","Doppelt","Wenig"],ph:"HAHLP",ex:"'Halb' = half. 'Halb drei' = 2:30 (half to three — confusing!)." },
    { type:"fillblank",q:"Ich brauche _____ Minuten. (10)",a:"zehn",o:["zwei","fünf","zehn","zwanzig"],ph:"TSAYN",ex:"Zehn = 10. A useful time estimate." },
    { type:"translate",q:"Fifteen",a:"Fünfzehn",o:["Fünf","Fünfzehn","Fünfzig","Fünfhundert"],ph:"FOONF-tsayn",ex:"13-19 pattern: number + zehn (ten)." },
    { type:"translate",q:"One thousand",a:"Tausend",o:["Hundert","Tausend","Million","Zehntausend"],ph:"TOW-zent",ex:"'Tausend' = 1000. 'Eine Million' = 1,000,000." },
    { type:"fillblank",q:"Es gibt _____ Personen hier. (12)",a:"zwölf",o:["zwei","zehn","zwölf","zwanzig"],ph:"TSVOLF",ex:"'Zwölf' = 12. 'Es gibt' = there are." },
    { type:"scenario",q:"Ask the price of something:",a:"Was kostet das?",o:["Wo ist das?","Was kostet das?","Was ist das?","Wer ist das?"],ph:"vahs KOS-tet dahs",ex:"Simplified version of 'Wie viel kostet das?' Both work." },
    { type:"translate",q:"Forty",a:"Vierzig",o:["Vierzehn","Vierzig","Vierhundert","Fünfzig"],ph:"FEER-tsig",ex:"Vierzehn=14, Vierzig=40, Vierhundert=400." },
    { type:"translate",q:"Zero",a:"Null",o:["Eins","Nichts","Null","Keine"],ph:"NOOL",ex:"Same as English 'null'. Used for phone numbers and scores." },
    { type:"scenario",q:"Give your phone number: 555:",a:"Fünf, fünf, fünf",o:["Drei, drei, drei","Fünf, fünf, fünf","Sechs, sechs, sechs","Eins, eins, eins"],ph:"FOONF FOONF FOONF",ex:"Phone numbers are said digit by digit, like Spanish." },
    { type:"translate",q:"Third",a:"Dritte",o:["Erste","Zweite","Dritte","Vierte"],ph:"DRIH-teh",ex:"Ordinals: erste, zweite, dritte, vierte, fünfte." },
    { type:"fillblank",q:"Wir sind _____ im Team. (6)",a:"sechs",o:["drei","fünf","sechs","sieben"],ph:"ZEHKS",ex:"Sechs = 6. Sieben = 7." },
    { type:"fillblank",q:"Meine Adresse ist Nummer _____. (200)",a:"zweihundert",o:["zwanzig","zweihundert","zweitausend","zwölf"],ph:"TSVY-hoon-dert",ex:"200 = zweihundert. 2000 = zweitausend." },
  ],
  4: [
    { type:"translate",q:"Where is...?",a:"Wo ist...?",o:["Wie ist...?","Wo ist...?","Was ist...?","Wann ist...?"],ph:"VOH ist",ex:"'Wo' = where. Short and simple." },
    { type:"translate",q:"Turn left",a:"Links abbiegen",o:["Geradeaus","Links abbiegen","Rechts abbiegen","Hier anhalten"],ph:"LINKS AHP-bee-gen",ex:"'Links' = left, 'rechts' = right, 'abbiegen' = to turn." },
    { type:"fillblank",q:"Das Restaurant ist _____.",a:"rechts",o:["oben","unten","rechts","weit"],ph:"REKHTS",ex:"'Rechts' = right. 'Links' = left." },
    { type:"scenario",q:"Ask where the train station is:",a:"Entschuldigung, wo ist der Bahnhof?",o:["Wie spät ist es?","Entschuldigung, wo ist der Bahnhof?","Ich möchte zum Park","Was kostet das Taxi?"],ph:"voh ist dehr BAHN-hohf",ex:"'Bahnhof' = train station. Germany runs on trains." },
    { type:"translate",q:"Go straight",a:"Geradeaus",o:["Links abbiegen","Geradeaus","Anhalten","Zurück"],ph:"geh-RAH-deh-OWS",ex:"One word for 'straight ahead'. Very useful." },
    { type:"translate",q:"Near / Far",a:"Nah / Weit",o:["Groß / Klein","Nah / Weit","Oben / Unten","Hier / Dort"],ph:"NAH / VITE",ex:"'In der Nähe' = nearby. 'Weit weg' = far away." },
    { type:"fillblank",q:"Ich _____ ein Taxi, bitte.",a:"brauche",o:["möchte","brauche","habe","bin"],ph:"BROW-kheh",ex:"'Brauchen' = to need. 'Ich brauche' = I need." },
    { type:"translate",q:"The store",a:"Das Geschäft",o:["Das Haus","Das Geschäft","Die Kirche","Die Schule"],ph:"dahs geh-SHEHFT",ex:"Also 'der Laden'. Both mean store/shop." },
    { type:"scenario",q:"Tell a taxi driver to stop here:",a:"Halten Sie hier, bitte",o:["Schneller, bitte","Halten Sie hier, bitte","Geradeaus","Links abbiegen"],ph:"HAHL-ten zee HEER BIH-teh",ex:"'Halten' = to stop. 'Sie' = formal you." },
    { type:"translate",q:"Street",a:"Die Straße",o:["Der Park","Die Straße","Das Gebäude","Der Platz"],ph:"dee SHTRAH-seh",ex:"'Straße' = street. Note the 'ß' = ss sound." },
    { type:"fillblank",q:"Ist es _____ von hier?",a:"weit",o:["hier","weit","nah","gut"],ph:"VITE",ex:"'Ist es weit?' = Is it far? Simple distance question." },
    { type:"translate",q:"Behind",a:"Hinter",o:["Vor","Hinter","Über","Unter"],ph:"HIN-ter",ex:"'Hinter' = behind. 'Vor' = in front of." },
    { type:"scenario",q:"Ask how far the airport is:",a:"Wie weit ist der Flughafen?",o:["Wo ist das Flugzeug?","Wie weit ist der Flughafen?","Was kostet der Flug?","Wann geht der Flug?"],ph:"vee VITE ist dehr FLOOP-hah-fen",ex:"'Flughafen' = airport (literally fly-harbor)." },
    { type:"translate",q:"Next to",a:"Neben",o:["Über","Neben","Unter","Weit von"],ph:"NAY-ben",ex:"'Neben dem Hotel' = next to the hotel." },
    { type:"fillblank",q:"Die Bank ist _____ der Apotheke.",a:"gegenüber",o:["in","gegenüber","über","unter"],ph:"GAY-gen-oo-ber",ex:"'Gegenüber' = across from / opposite." },
    { type:"translate",q:"Corner",a:"Die Ecke",o:["Die Straße","Die Ecke","Der Block","Die Allee"],ph:"dee EH-keh",ex:"'An der Ecke' = at/on the corner." },
    { type:"scenario",q:"Ask someone to repeat:",a:"Können Sie das wiederholen, bitte?",o:["Langsamer, bitte","Können Sie das wiederholen, bitte?","Ich verstehe nicht","Sprechen Sie lauter"],ph:"KUH-nen zee dahs VEE-der-hoh-len",ex:"Very polite request. You'll need this constantly." },
    { type:"translate",q:"Block",a:"Der Block",o:["Die Straße","Der Block","Das Viertel","Die Zone"],ph:"dehr BLOK",ex:"'Zwei Blocks weiter' = two blocks further." },
    { type:"fillblank",q:"Gehen Sie zwei _____ weiter.",a:"Blocks",o:["Straßen","Blocks","Meter","Schritte"],ph:"BLOKS VY-ter",ex:"Walk two more blocks." },
    { type:"translate",q:"In front of",a:"Vor",o:["Hinter","Vor","Neben","Weit von"],ph:"FOR",ex:"'Vor dem Gebäude' = in front of the building." },
  ],
  5: [
    { type:"translate",q:"I work in government",a:"Ich arbeite in der Regierung",o:["Ich arbeite in der Regierung","Ich studiere an der Uni","Ich wohne in der Stadt","Ich gehe ins Büro"],ph:"eesh AR-by-teh in dehr reh-GEER-oong",ex:"'Arbeiten' = to work. 'Regierung' = government." },
    { type:"fillblank",q:"Ich bin _____ für ein Programm.",a:"Manager",o:["Arzt","Manager","Professor","Anwalt"],ph:"MEH-neh-jer",ex:"German uses many English loanwords in business." },
    { type:"translate",q:"Meeting",a:"Die Besprechung",o:["Das Büro","Die Besprechung","Das Projekt","Das Team"],ph:"dee beh-SHPREH-khoong",ex:"Also 'das Meeting' (English loanword) is very common." },
    { type:"translate",q:"Team",a:"Das Team",o:["Die Gruppe","Das Team","Der Chef","Die Arbeit"],ph:"dahs TEEM",ex:"Direct English loanword. Very common in German workplaces." },
    { type:"scenario",q:"Introduce your job:",a:"Ich arbeite bei der Regierung als Manager",o:["Ich bin Student","Ich arbeite bei der Regierung als Manager","Ich habe keine Arbeit","Ich gehe ins Büro"],ph:"eesh AR-by-teh by dehr reh-GEER-oong ahls MEH-neh-jer",ex:"'Bei' = at/for. 'Als' = as. Natural job introduction." },
    { type:"fillblank",q:"Ich habe eine _____ um drei.",a:"Besprechung",o:["Mahlzeit","Besprechung","Party","Klasse"],ph:"beh-SHPREH-khoong",ex:"'Um drei' = at three. Time with 'um'." },
    { type:"translate",q:"Boss",a:"Der Chef",o:["Der Freund","Der Chef","Der Kollege","Der Kunde"],ph:"dehr SHEF",ex:"From French. 'Chefin' = female boss." },
    { type:"translate",q:"Project",a:"Das Projekt",o:["Die Arbeit","Das Büro","Das Projekt","Das Problem"],ph:"dahs proh-YEHKT",ex:"Nearly identical to English. Easy to remember." },
    { type:"fillblank",q:"Mein _____ hat neunzehn Leute.",a:"Team",o:["Büro","Team","Familie","Klasse"],ph:"TEEM",ex:"'Leute' = people. 'Neunzehn' = nineteen." },
    { type:"scenario",q:"Say you're busy:",a:"Ich bin beschäftigt mit der Arbeit",o:["Ich habe keine Zeit","Ich bin beschäftigt mit der Arbeit","Ich gehe nach Hause","Ich möchte mich ausruhen"],ph:"eesh bin beh-SHEHF-tigt",ex:"'Beschäftigt' = busy/occupied." },
    { type:"translate",q:"Schedule",a:"Der Zeitplan",o:["Der Kalender","Der Zeitplan","Die Uhr","Die Zeit"],ph:"dehr TSAIT-plahn",ex:"'Zeit' = time, 'Plan' = plan. The time plan." },
    { type:"fillblank",q:"Ich muss dieses _____ heute fertig machen.",a:"Projekt",o:["Besprechung","Projekt","Team","Chef"],ph:"proh-YEHKT HOY-teh FEHR-tig",ex:"'Muss' = must. 'Fertig machen' = to finish." },
    { type:"translate",q:"Email",a:"Die E-Mail",o:["Die Nachricht","Die E-Mail","Der Brief","Das Telefon"],ph:"dee EE-mayl",ex:"Same word borrowed from English." },
    { type:"scenario",q:"Ask what time the meeting is:",a:"Um wie viel Uhr ist die Besprechung?",o:["Wo ist die Besprechung?","Um wie viel Uhr ist die Besprechung?","Wer kommt zur Besprechung?","Warum gibt es eine Besprechung?"],ph:"oom vee feel OOR",ex:"'Um wie viel Uhr?' = At what time?" },
    { type:"translate",q:"Coworker",a:"Der Kollege",o:["Der Freund","Der Kollege","Der Chef","Der Mitarbeiter"],ph:"dehr koh-LAY-geh",ex:"'Kollegin' = female coworker." },
    { type:"fillblank",q:"Ich gehe um sechs Uhr _____.",a:"nach Hause",o:["essen","nach Hause","schlafen","ankommen"],ph:"nahkh HOW-zeh",ex:"'Nach Hause' = homeward. 'Zu Hause' = at home." },
    { type:"translate",q:"Deadline",a:"Die Frist",o:["Die Endzeit","Die Frist","Der letzte Tag","Die Zeitgrenze"],ph:"dee FRIST",ex:"Short and sharp. 'Die Frist läuft ab' = the deadline is approaching." },
    { type:"scenario",q:"Say you'll finish by Friday:",a:"Ich bin bis Freitag fertig",o:["Ich mache es morgen","Ich bin bis Freitag fertig","Ich kann heute nicht","Ich brauche mehr Zeit"],ph:"eesh bin bis FRY-tahg FEHR-tig",ex:"'Bis' = by/until. 'Freitag' = Friday." },
    { type:"translate",q:"Salary",a:"Das Gehalt",o:["Das Geld","Das Gehalt","Die Bezahlung","Die Rechnung"],ph:"dahs geh-HAHLT",ex:"'Gehalt' = salary (monthly). 'Lohn' = wages (hourly)." },
    { type:"fillblank",q:"Ich arbeite von Montag bis _____.",a:"Freitag",o:["Donnerstag","Freitag","Samstag","Sonntag"],ph:"FRY-tahg",ex:"Monday through Friday: Montag, Dienstag, Mittwoch, Donnerstag, Freitag." },
  ],
  6: [
    { type:"translate",q:"What time is it?",a:"Wie spät ist es?",o:["Wie spät ist es?","Welcher Tag ist es?","Wann ist es?","Wie geht's?"],ph:"vee SHPAYT ist ehs",ex:"Literally 'how late is it?' The standard way to ask time." },
    { type:"translate",q:"It's hot",a:"Es ist heiß",o:["Es ist kalt","Es ist heiß","Es regnet","Es ist bewölkt"],ph:"ehs ist HICE",ex:"Simple weather: 'Es ist' + adjective." },
    { type:"fillblank",q:"Heute ist _____.",a:"Dienstag",o:["Januar","Dienstag","Sommer","Morgen"],ph:"DEENS-tahg",ex:"Days of the week are capitalized in German (unlike Spanish)." },
    { type:"translate",q:"Tomorrow",a:"Morgen",o:["Gestern","Heute","Morgen","Jetzt"],ph:"MOR-gen",ex:"Also means 'morning'. Context makes it clear." },
    { type:"translate",q:"It's raining",a:"Es regnet",o:["Es ist sonnig","Es regnet","Es ist windig","Es schneit"],ph:"ehs RAYG-net",ex:"'Regnen' = to rain. 'Es regnet' = it rains/it's raining." },
    { type:"fillblank",q:"Es ist _____ Uhr nachmittags. (3:00)",a:"drei",o:["zwei","drei","fünf","eins"],ph:"dry",ex:"'Nachmittags' = in the afternoon." },
    { type:"scenario",q:"Tell someone it's cold today:",a:"Heute ist es kalt",o:["Heute ist es heiß","Heute ist es kalt","Heute ist es schön","Heute ist es gut"],ph:"HOY-teh ist ehs KAHLT",ex:"'Kalt' = cold. Simple and direct." },
    { type:"translate",q:"Week",a:"Die Woche",o:["Der Tag","Der Monat","Die Woche","Das Jahr"],ph:"dee VOH-kheh",ex:"'Diese Woche' = this week. 'Wochenende' = weekend." },
    { type:"translate",q:"Yesterday",a:"Gestern",o:["Heute","Morgen","Gestern","Jetzt"],ph:"GEHS-tern",ex:"Gestern = yesterday. Heute = today. Morgen = tomorrow." },
    { type:"fillblank",q:"Letzten _____ war ich im Park.",a:"Sonntag",o:["Januar","Sommer","Sonntag","Jahr"],ph:"ZOHN-tahg",ex:"'Letzten' = last. 'Letzten Sonntag' = last Sunday." },
    { type:"translate",q:"Spring",a:"Frühling",o:["Sommer","Frühling","Herbst","Winter"],ph:"FROO-ling",ex:"Seasons: Frühling, Sommer, Herbst, Winter." },
    { type:"fillblank",q:"Es ist sehr _____ draußen.",a:"windig",o:["sonnig","windig","nass","kalt"],ph:"VIN-dig",ex:"'Windig' = windy. 'Draußen' = outside." },
    { type:"scenario",q:"Ask if it will rain tomorrow:",a:"Wird es morgen regnen?",o:["Ist es morgen kalt?","Wird es morgen regnen?","Wie spät ist es?","Ist es Sommer?"],ph:"veert ehs MOR-gen RAYG-nen",ex:"'Wird' = will. Future tense helper verb." },
    { type:"translate",q:"Month",a:"Der Monat",o:["Der Tag","Die Woche","Der Monat","Das Jahr"],ph:"dehr MOH-naht",ex:"'Diesen Monat' = this month." },
    { type:"translate",q:"It's sunny",a:"Es ist sonnig",o:["Es ist heiß","Es ist sonnig","Es ist klar","Es ist schön"],ph:"ehs ist ZOH-nig",ex:"'Sonnig' = sunny. 'Die Sonne' = the sun." },
    { type:"fillblank",q:"Im _____ ist es sehr heiß.",a:"Sommer",o:["Winter","Sommer","Herbst","März"],ph:"ZOH-mer",ex:"'Im Sommer' = in summer." },
    { type:"translate",q:"Cloudy",a:"Bewölkt",o:["Sonnig","Bewölkt","Regnerisch","Windig"],ph:"beh-VUHLT",ex:"'Bewölkt' = cloudy. 'Die Wolke' = the cloud." },
    { type:"scenario",q:"Say the weather is nice:",a:"Heute ist schönes Wetter",o:["Heute ist schlechtes Wetter","Heute ist schönes Wetter","Es regnet","Heute ist es kalt"],ph:"HOY-teh ist SHUH-nes VEH-ter",ex:"'Schönes Wetter' = nice weather. 'Schlechtes' = bad." },
    { type:"translate",q:"At night",a:"In der Nacht",o:["Am Morgen","Am Nachmittag","In der Nacht","Am Mittag"],ph:"in dehr NAHKHT",ex:"Time of day: Morgen, Nachmittag, Abend, Nacht." },
    { type:"fillblank",q:"Am _____ arbeite ich nicht.",a:"Samstag",o:["Montag","Mittwoch","Freitag","Samstag"],ph:"ZAHMS-tahg",ex:"'Am Samstag' = on Saturday. Weekend!" },
  ],
  7: [
    { type:"translate",q:"Mother",a:"Die Mutter",o:["Der Vater","Die Mutter","Die Schwester","Die Oma"],ph:"dee MOO-ter",ex:"Also 'Mama' casually. 'Mutti' = mommy." },
    { type:"translate",q:"Brother",a:"Der Bruder",o:["Der Cousin","Der Onkel","Der Bruder","Der Sohn"],ph:"dehr BROO-der",ex:"'Schwester' = sister. 'Geschwister' = siblings." },
    { type:"fillblank",q:"Mein _____ ist vier Jahre alt.",a:"Neffe",o:["Bruder","Neffe","Opa","Vater"],ph:"NEH-feh",ex:"'Neffe' = nephew. 'Nichte' = niece." },
    { type:"translate",q:"Niece",a:"Die Nichte",o:["Die Cousine","Die Nichte","Die Tochter","Die Schwester"],ph:"dee NISH-teh",ex:"Female version of 'Neffe'." },
    { type:"scenario",q:"Tell someone about your pets:",a:"Ich habe zwei Hunde",o:["Ich habe eine Katze","Ich habe zwei Hunde","Ich habe keine Haustiere","Ich möchte einen Vogel"],ph:"eesh HAH-beh tsvy HOON-deh",ex:"'Hund' = dog. 'Hunde' = dogs. 'Katze' = cat." },
    { type:"translate",q:"Grandfather",a:"Der Opa",o:["Der Vater","Der Onkel","Der Opa","Der Cousin"],ph:"dehr OH-pah",ex:"Also 'Großvater' (formal). 'Oma' = grandmother." },
    { type:"translate",q:"Wife / Husband",a:"Die Frau / Der Mann",o:["Die Freundin / Der Freund","Die Frau / Der Mann","Die Schwester / Der Bruder","Die Tochter / Der Sohn"],ph:"dee FROW / dehr MAHN",ex:"'Frau' also means 'woman'. 'Mann' also means 'man'." },
    { type:"translate",q:"Son / Daughter",a:"Der Sohn / Die Tochter",o:["Der Cousin / Die Cousine","Der Sohn / Die Tochter","Der Enkel / Die Enkelin","Der Neffe / Die Nichte"],ph:"dehr ZOHN / dee TOKH-ter",ex:"'Kinder' = children." },
    { type:"scenario",q:"Say you have a big family:",a:"Ich habe eine große Familie",o:["Meine Familie ist klein","Ich habe eine große Familie","Ich habe keine Familie","Ich wohne allein"],ph:"eesh HAH-beh eye-neh GROH-seh fah-MEE-lee-eh",ex:"'Groß' = big. 'Klein' = small." },
    { type:"fillblank",q:"Meine _____ kocht sehr gut.",a:"Oma",o:["Hund","Oma","Auto","Haus"],ph:"OH-mah",ex:"'Kochen' = to cook. 'Oma kocht gut' = grandma cooks well." },
    { type:"translate",q:"Cousin (male)",a:"Der Cousin",o:["Der Bruder","Der Cousin","Der Onkel","Der Neffe"],ph:"dehr koo-ZANG",ex:"Borrowed from French. 'Cousine' = female cousin." },
    { type:"translate",q:"Uncle",a:"Der Onkel",o:["Der Opa","Der Cousin","Der Onkel","Der Vater"],ph:"dehr OHN-kel",ex:"'Tante' = aunt." },
    { type:"fillblank",q:"Meine _____ wohnen in Texas.",a:"Eltern",o:["Freunde","Eltern","Hunde","Chefs"],ph:"EHL-tern",ex:"'Eltern' = parents. 'Vater' = father, 'Mutter' = mother." },
    { type:"scenario",q:"Introduce your sister:",a:"Das ist meine Schwester",o:["Das ist meine Mutter","Das ist meine Schwester","Das ist meine Cousine","Das ist meine Freundin"],ph:"dahs ist MY-neh SHVEHS-ter",ex:"'Das ist...' = that is... Simple introduction." },
    { type:"translate",q:"Grandchildren",a:"Die Enkel",o:["Die Kinder","Die Neffen","Die Enkel","Die Cousins"],ph:"dee EHN-kel",ex:"'Enkel' = grandchild. 'Enkelin' = granddaughter." },
    { type:"fillblank",q:"Wir sind eine sehr _____ Familie.",a:"enge",o:["große","enge","schöne","neue"],ph:"EHN-geh",ex:"'Eng' = close/tight. 'Enge Familie' = close family." },
    { type:"translate",q:"Girlfriend / Boyfriend",a:"Die Freundin / Der Freund",o:["Die Frau / Der Mann","Die Freundin / Der Freund","Die Schwester / Der Bruder","Die Frau / Der Herr"],ph:"dee FROYN-din / dehr FROYNT",ex:"Same word as 'friend'. Context (and 'mein/meine') clarifies." },
    { type:"scenario",q:"Say your nephew loves trucks:",a:"Mein Neffe liebt Lastwagen",o:["Mein Neffe ist groß","Mein Neffe liebt Lastwagen","Er ist vier Jahre alt","Er wohnt bei mir"],ph:"mine NEH-feh LEEPT LAHST-vah-gen",ex:"'Lieben' = to love. 'Lastwagen' = trucks (literally load-wagon)." },
    { type:"translate",q:"Twins",a:"Die Zwillinge",o:["Die Geschwister","Die Zwillinge","Die Cousins","Die Freunde"],ph:"dee TSVIL-ing-eh",ex:"From 'zwei' (two). 'Zwilling' = twin." },
    { type:"fillblank",q:"Meine liebste _____ ist Weihnachten.",a:"Tradition",o:["Mahlzeit","Tradition","Party","Familie"],ph:"trah-dee-tsee-OHN",ex:"'Tradition' = tradition. 'Weihnachten' = Christmas." },
  ],
  8: [
    { type:"translate",q:"To go",a:"Gehen",o:["Sein","Gehen","Sehen","Geben"],ph:"GAY-en",ex:"'Ich gehe' = I go. 'Er geht' = he goes." },
    { type:"translate",q:"To want",a:"Wollen",o:["Können","Wollen","Müssen","Wissen"],ph:"VOH-len",ex:"Modal verb: 'Ich will' = I want. Direct and strong." },
    { type:"fillblank",q:"Ich _____ ins Restaurant gehen.",a:"möchte",o:["habe","möchte","kann","muss"],ph:"MUHKH-teh",ex:"'Möchte' = would like. Politer than 'will' (want)." },
    { type:"translate",q:"To know (a fact)",a:"Wissen",o:["Kennen","Wissen","Denken","Glauben"],ph:"VIH-sen",ex:"'Wissen' = know facts. 'Kennen' = know people/places. Same as saber/conocer." },
    { type:"translate",q:"I can",a:"Ich kann",o:["Ich will","Ich muss","Ich kann","Ich weiß"],ph:"eesh KAHN",ex:"'Können' = to be able to. Very useful modal verb." },
    { type:"fillblank",q:"Wir _____ sonntags in den Park.",a:"gehen",o:["sind","gehen","haben","machen"],ph:"GAY-en",ex:"'Gehen' = to go. 'Sonntags' = on Sundays." },
    { type:"translate",q:"To do / To make",a:"Machen",o:["Sagen","Machen","Stellen","Haben"],ph:"MAH-khen",ex:"'Was machst du?' = What are you doing?" },
    { type:"scenario",q:"Say 'I need to work':",a:"Ich muss arbeiten",o:["Ich will arbeiten","Ich muss arbeiten","Ich kann arbeiten","Ich soll arbeiten"],ph:"eesh MOOS AR-by-ten",ex:"'Müssen' = must/have to. Stronger than 'sollen' (should)." },
    { type:"fillblank",q:"_____ du, wo die Bank ist?",a:"Weißt",o:["Kennst","Weißt","Willst","Kannst"],ph:"VYST",ex:"'Weißt du?' = Do you know? (a fact/location)." },
    { type:"translate",q:"To speak",a:"Sprechen",o:["Hören","Sprechen","Lesen","Schreiben"],ph:"SHPREH-khen",ex:"'Sprechen Sie Englisch?' = Do you speak English?" },
    { type:"translate",q:"To eat",a:"Essen",o:["Trinken","Essen","Kochen","Bestellen"],ph:"EH-sen",ex:"Irregular: ich esse, du isst, er isst." },
    { type:"translate",q:"To sleep",a:"Schlafen",o:["Ausruhen","Schlafen","Träumen","Aufwachen"],ph:"SHLAH-fen",ex:"'Ich schlafe' = I sleep. 'Einschlafen' = to fall asleep." },
    { type:"fillblank",q:"Sie _____ sehr gut Deutsch.",a:"spricht",o:["weiß","spricht","hat","kennt"],ph:"SHPRISHT",ex:"'Spricht' = speaks. Irregular: spreche, sprichst, spricht." },
    { type:"scenario",q:"Say you don't understand:",a:"Ich verstehe nicht",o:["Ich weiß nicht","Ich verstehe nicht","Ich kann nicht","Ich will nicht"],ph:"eesh fehr-SHTAY-eh NISHT",ex:"Your #1 survival phrase. 'Verstehen' = to understand." },
    { type:"translate",q:"To give",a:"Geben",o:["Nehmen","Geben","Stellen","Bringen"],ph:"GAY-ben",ex:"'Gib mir...' = Give me... Irregular: gebe, gibst, gibt." },
    { type:"fillblank",q:"_____ du mitkommen?",a:"Kannst",o:["Weißt","Kannst","Willst","Musst"],ph:"KAHNST",ex:"'Kannst du...?' = Can you...?" },
    { type:"translate",q:"To leave",a:"Verlassen",o:["Eintreten","Verlassen","Ankommen","Zurückkommen"],ph:"fehr-LAH-sen",ex:"Also 'gehen' (to go/leave). 'Abfahren' = to depart." },
    { type:"translate",q:"To bring",a:"Bringen",o:["Tragen","Bringen","Geben","Stellen"],ph:"BRING-en",ex:"'Bring mir...' = Bring me... Same root as English." },
    { type:"scenario",q:"Ask for help:",a:"Können Sie mir helfen?",o:["Können Sie mir geben?","Können Sie mir helfen?","Können Sie mir sagen?","Können Sie mir bringen?"],ph:"KUH-nen zee meer HEHL-fen",ex:"'Helfen' = to help. Formal and polite." },
    { type:"fillblank",q:"Ich werde morgen früh _____.",a:"gehen",o:["schlafen","gehen","essen","arbeiten"],ph:"GAY-en",ex:"'Ich werde...gehen' = I will go. Future with 'werden'." },
  ],
  9: [
    { type:"scenario",q:"Meet someone new at a party:",a:"Hallo! Wie heißen Sie?",o:["Tschüss!","Hallo! Wie heißen Sie?","Was kostet das?","Ich habe Hunger"],ph:"vee HY-sen zee",ex:"Formal. 'Wie heißt du?' for casual." },
    { type:"fillblank",q:"Woher _____ Sie?",a:"kommen",o:["sind","kommen","haben","gehen"],ph:"KOH-men",ex:"'Woher kommen Sie?' = Where do you come from?" },
    { type:"scenario",q:"Someone asks what you do:",a:"Ich arbeite bei der Regierung als Manager.",o:["Ich weiß nicht","Ich arbeite bei der Regierung als Manager.","Ich bin Student","Ich arbeite nicht"],ph:"eesh AR-by-teh by dehr reh-GEER-oong",ex:"'Bei' = at/for (company/org). Natural work introduction." },
    { type:"translate",q:"I like it a lot",a:"Das gefällt mir sehr",o:["Das gefällt mir sehr","Das gefällt mir nicht","Das ist toll","Das ist okay"],ph:"dahs geh-FEHLT meer ZAYR",ex:"'Gefallen' works like 'gustar' — the thing pleases you." },
    { type:"fillblank",q:"Hat _____ das Essen geschmeckt?",a:"Ihnen",o:["mir","Ihnen","ihm","uns"],ph:"EE-nen",ex:"'Ihnen' = to you (formal). Asking if they enjoyed the food." },
    { type:"scenario",q:"Find the bathroom:",a:"Entschuldigung, wo ist die Toilette?",o:["Ich brauche Wasser","Entschuldigung, wo ist die Toilette?","Ich möchte gehen","Ich bin müde"],ph:"voh ist dee toy-LEH-teh",ex:"'Toilette' = bathroom/toilet. Germans are direct about it." },
    { type:"translate",q:"See you later",a:"Bis später",o:["Tschüss","Auf Wiedersehen","Bis später","Gute Nacht"],ph:"bis SHPAY-ter",ex:"'Bis' = until. 'Später' = later. Casual farewell." },
    { type:"fillblank",q:"Es war schön, Sie _____.",a:"kennenzulernen",o:["zu sehen","kennenzulernen","zu treffen","zu haben"],ph:"KEH-nen-tsoo-LEHR-nen",ex:"'Kennenzulernen' = to get to know. The formal 'nice to meet you'." },
    { type:"scenario",q:"Ask for their number:",a:"Kann ich Ihre Nummer haben?",o:["Wie heißen Sie?","Kann ich Ihre Nummer haben?","Wo wohnen Sie?","Haben Sie ein Auto?"],ph:"kahn eesh EE-reh NOO-mer HAH-ben",ex:"'Ihre' = your (formal). Polite way to ask." },
    { type:"translate",q:"Let's go!",a:"Los geht's!",o:["Warte!","Los geht's!","Stopp!","Schnell!"],ph:"LOHS gayts",ex:"Casual and energetic. Like '¡Vamos!'" },
    { type:"scenario",q:"Say you're learning German:",a:"Ich lerne Deutsch",o:["Ich spreche Deutsch","Ich lerne Deutsch","Ich spreche kein Deutsch","Ich kann ein bisschen"],ph:"eesh LEHR-neh DOYTSH",ex:"'Lernen' = to learn. Simple and honest." },
    { type:"fillblank",q:"Wollen wir etwas _____ gehen?",a:"trinken",o:["machen","trinken","sehen","geben"],ph:"TRINK-en",ex:"'Etwas trinken gehen' = go have a drink. Social invitation." },
    { type:"translate",q:"What do you think?",a:"Was denkst du?",o:["Was willst du?","Was denkst du?","Was machst du?","Was sagst du?"],ph:"vahs DAYNKST doo",ex:"'Denken' = to think. Good conversation driver." },
    { type:"scenario",q:"Compliment someone's cooking:",a:"Das schmeckt fantastisch!",o:["Es ist okay","Das schmeckt fantastisch!","Ich habe Hunger","Ich möchte mehr"],ph:"dahs SHMEHKT fahn-TAHS-tish",ex:"'Schmecken' = to taste. Highest food compliment." },
    { type:"translate",q:"I agree",a:"Ich stimme zu",o:["Ich glaube ja","Ich stimme zu","Sie haben Recht","Klar"],ph:"eesh SHTIM-meh TSOO",ex:"'Zustimmen' = to agree. Separable verb." },
    { type:"fillblank",q:"Ich hatte einen sehr schönen _____.",a:"Abend",o:["schlecht","Abend","groß","viel"],ph:"AH-bent",ex:"'Einen schönen Abend' = a nice evening." },
    { type:"scenario",q:"Say goodbye after a great time:",a:"Es war toll, danke!",o:["Tschüss","Es war toll, danke!","Gute Nacht","Bis morgen"],ph:"ehs vahr TOHL DAHN-keh",ex:"'Toll' = great/awesome. Warm farewell." },
    { type:"translate",q:"Of course!",a:"Natürlich!",o:["Vielleicht!","Natürlich!","Ich weiß nicht!","Wer weiß!"],ph:"nah-TOOR-lish",ex:"Also 'Klar!' (clear/sure) for casual agreement." },
    { type:"fillblank",q:"Lass uns am Wochenende etwas _____.",a:"unternehmen",o:["arbeiten","unternehmen","schlafen","lernen"],ph:"oon-ter-NAY-men",ex:"'Etwas unternehmen' = to do something (activity). Weekend plans." },
    { type:"scenario",q:"Invite someone to hang out:",a:"Hast du am Wochenende Zeit?",o:["Hast du Arbeit?","Hast du am Wochenende Zeit?","Gehst du arbeiten?","Wo wohnst du?"],ph:"hahst doo ahm VOH-khen-en-deh TSAIT",ex:"'Hast du Zeit?' = Do you have time? Casual and natural." },
  ],
};

// ═══════════ SPEECH ═══════════
const speak = (text, lang = "es-MX") => {
  try {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.82;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    }
  } catch (e) {}
};

// ═══════════ SOUND ═══════════
const useSound = () => {
  const c = useRef(null);
  const g = () => { if (!c.current) c.current = new (window.AudioContext || window.webkitAudioContext)(); return c.current; };
  return (t) => {
    try {
      const x = g(), o = x.createOscillator(), gn = x.createGain();
      o.connect(gn); gn.connect(x.destination);
      if (t === "ok") { o.frequency.setValueAtTime(523, x.currentTime); o.frequency.setValueAtTime(659, x.currentTime + 0.1); o.frequency.setValueAtTime(784, x.currentTime + 0.2); gn.gain.setValueAtTime(0.1, x.currentTime); gn.gain.exponentialRampToValueAtTime(0.01, x.currentTime + 0.4); o.start(x.currentTime); o.stop(x.currentTime + 0.4); }
      else if (t === "no") { o.frequency.setValueAtTime(200, x.currentTime); o.frequency.setValueAtTime(150, x.currentTime + 0.15); o.type = "sawtooth"; gn.gain.setValueAtTime(0.07, x.currentTime); gn.gain.exponentialRampToValueAtTime(0.01, x.currentTime + 0.3); o.start(x.currentTime); o.stop(x.currentTime + 0.3); }
      else if (t === "up") { [523, 659, 784, 1047].forEach((f, i) => { const oo = x.createOscillator(), gg = x.createGain(); oo.connect(gg); gg.connect(x.destination); oo.frequency.setValueAtTime(f, x.currentTime + i * 0.12); gg.gain.setValueAtTime(0.08, x.currentTime + i * 0.12); gg.gain.exponentialRampToValueAtTime(0.01, x.currentTime + i * 0.12 + 0.3); oo.start(x.currentTime + i * 0.12); oo.stop(x.currentTime + i * 0.12 + 0.3); }); }
    } catch (e) {}
  };
};

// ═══════════ MAIN APP ═══════════
export default function Dime() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState("login"); // login|signup
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authName, setAuthName] = useState("");
  const [authErr, setAuthErr] = useState("");

  // Game state
  const [scr, setScr] = useState("landing");
  const [lang, setLang] = useState("es");
  const [prog, setProg] = useState({});
  const [lvl, setLvl] = useState(0);
  const [qi, setQi] = useState(0);
  const [pts, setPts] = useState(0);
  const [sel, setSel] = useState(null);
  const [show, setShow] = useState(false);
  const [qs, setQs] = useState([]);
  const [cmb, setCmb] = useState(0);
  const [res, setRes] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [mustPass, setMustPass] = useState(true);
  const snd = useSound();

  const LEVELS = lang === "de" ? DE_LEVELS : ES_LEVELS;
  const QUESTIONS = lang === "de" ? DE_Q : ES_Q;
  const speechLang = lang === "de" ? "de-DE" : "es-MX";

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Load progress from Firestore
        const docRef = doc(db, "dime_users", u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProg(docSnap.data().progress || {});
        }
        setScr("langselect");
      } else {
        setUser(null);
        setScr("landing");
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => { if ("speechSynthesis" in window) window.speechSynthesis.getVoices(); }, []);

  // Save progress to Firestore
  const saveProg = async (newProg) => {
    setProg(newProg);
    if (user) {
      try {
        await setDoc(doc(db, "dime_users", user.uid), {
          email: user.email,
          name: authName || user.email,
          progress: newProg,
          lastUpdated: serverTimestamp(),
        }, { merge: true });
      } catch (e) { console.error("Save error:", e); }
    }
  };

  // Get lang-specific progress
  const lp = prog[lang] || { xp: 0, streak: 0, last: null, done: [], hi: {}, tc: 0, ta: 0 };
  const setLp = (update) => {
    const newLangProg = { ...lp, ...update };
    const newProg = { ...prog, [lang]: newLangProg, sound: prog.sound !== undefined ? prog.sound : true };
    saveProg(newProg);
  };

  const shuf = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = 0 | (Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

  const go = (l) => {
    const d = QUESTIONS[l];
    if (!d) return;
    setLvl(l);
    setQs(shuf(d).map((q) => ({ ...q, options: shuf(q.o) })));
    setQi(0); setPts(0); setCmb(0); setSel(null); setShow(false); setRes([]); setScr("play");
  };

  const pick = (a) => {
    if (show) return;
    const q = qs[qi]; const ok = a === q.a;
    setSel(a); setShow(true);

    // Auto-speak correct answer
    speak(q.a, speechLang);

    if (ok) { if (prog.sound !== false) snd("ok"); setPts((s) => s + 10 + Math.min(cmb, 5) * 2); setCmb((c) => c + 1); }
    else { if (prog.sound !== false) snd("no"); setCmb(0); }
    setRes((r) => [...r, { ok, q: q.q, you: a, ans: q.a, ex: q.ex, ph: q.ph }]);

    setTimeout(() => {
      if (qi + 1 < qs.length) { setQi((i) => i + 1); setSel(null); setShow(false); }
      else { const fs = ok ? pts + 10 + Math.min(cmb, 5) * 2 : pts; fin(fs); }
    }, 2000);
  };

  const fin = (fs) => {
    if (prog.sound !== false) snd("up");
    const today = new Date().toDateString();
    const wt = lp.last === today;
    const cc = res.filter((r) => r.ok).length + (sel === qs[qi]?.a ? 1 : 0);
    const allCorrect = cc === qs.length;
    const canAdvance = !mustPass || allCorrect;

    setLp({
      xp: lp.xp + fs,
      streak: wt ? lp.streak : lp.streak + 1,
      last: today,
      done: canAdvance && !lp.done.includes(lvl) ? [...lp.done, lvl] : lp.done,
      hi: { ...lp.hi, [lvl]: Math.max(lp.hi[lvl] || 0, fs) },
      tc: lp.tc + cc,
      ta: lp.ta + qs.length,
    });
    setPts(fs); setScr("results");
  };

  const retryMissed = () => {
    const missed = res.filter((r) => !r.ok);
    if (missed.length === 0) return;
    const missedQs = missed.map((m) => {
      const orig = (QUESTIONS[lvl] || []).find((q) => q.q === m.q);
      return orig ? { ...orig, options: shuf(orig.o) } : null;
    }).filter(Boolean);
    setQs(shuf(missedQs));
    setQi(0); setSel(null); setShow(false); setRes([]); setScr("play");
  };

  const unlk = (i) => { if (i === 0) return true; if (lang === "es" && i <= 9) return lp.done.includes(i - 1); if (lang === "es" && i > 9) return lp.done.filter((l) => l <= 9).length >= 10; return lp.done.includes(i - 1); };

  const rank = () => {
    const x = lp.xp || 0;
    if (x < 100) return { l: 1, t: "Beginner", n: 100 };
    if (x < 300) return { l: 2, t: "Student", n: 300 };
    if (x < 600) return { l: 3, t: "Apprentice", n: 600 };
    if (x < 1000) return { l: 4, t: "Speaker", n: 1000 };
    if (x < 1500) return { l: 5, t: "Conversationalist", n: 1500 };
    return { l: 6, t: lang === "es" ? "Boricua Honorario 🇵🇷" : "Ehrenbürger 🇩🇪", n: null };
  };

  const r = rank();
  const cq = qs[qi];

  const doShare = async () => {
    const t = `I'm learning ${LANGS[lang].name} on Dime ${LANGS[lang].flag}\n\nLevel ${r.l} — ${r.t}\n${lp.xp} XP · ${lp.streak} day streak 🔥\n${lp.done.length}/${LEVELS.length} levels\n\nhttps://playdime.app`;
    if (navigator.share) { try { await navigator.share({ title: "Dime", text: t }); } catch (e) {} }
    else { try { await navigator.clipboard.writeText(t); setToast("Copied!"); setTimeout(() => setToast(""), 2e3); } catch (e) {} }
  };

  // Auth handlers
  const handleSignup = async () => {
    setAuthErr("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, authEmail, authPass);
      await setDoc(doc(db, "dime_users", cred.user.uid), {
        email: authEmail,
        name: authName,
        progress: {},
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });
    } catch (e) { setAuthErr(e.message.replace("Firebase: ", "")); }
  };

  const handleLogin = async () => {
    setAuthErr("");
    try { await signInWithEmailAndPassword(auth, authEmail, authPass); }
    catch (e) { setAuthErr(e.message.replace("Firebase: ", "")); }
  };

  const handleLogout = async () => { await signOut(auth); setScr("landing"); };

  // Colors
  const C = { bg: "#0B0B0F", card: "rgba(255,255,255,0.028)", border: "rgba(255,255,255,0.05)", gold: "#E8A838", amber: "#F59E0B", warm: "#FCD34D", cyan: "#06B6D4", red: "#EF4444", green: "#10B981", text: "#E5E2ED", sub: "rgba(255,255,255,0.35)", muted: "rgba(255,255,255,0.15)" };

  const Btn = ({ children, primary, onClick, style: sx, disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{ background: primary ? `linear-gradient(135deg, ${C.gold}, #D97706)` : C.card, border: primary ? "none" : `1px solid ${C.border}`, borderRadius: 12, padding: "14px 24px", fontSize: 15, fontWeight: 700, color: primary ? "#0B0B0F" : C.text, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", width: "100%", transition: "all 0.15s", opacity: disabled ? 0.4 : 1, ...sx }}>{children}</button>
  );

  if (authLoading) return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontFamily: "'Playfair Display', serif", fontSize: 32 }}>dime</div>;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Instrument Sans', 'DM Sans', system-ui, sans-serif", color: C.text, position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet" />

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,168,56,0.04) 0%, transparent 60%)", top: "-20%", right: "-20%", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.03) 0%, transparent 60%)", bottom: "10%", left: "-10%", filter: "blur(80px)" }} />
      </div>

      {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: C.gold, color: "#000", padding: "10px 28px", borderRadius: 100, fontSize: 13, fontWeight: 700, zIndex: 999 }}>{toast}</div>}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 440, margin: "0 auto", padding: "0 24px" }}>

        {/* ═══ LANDING ═══ */}
        {scr === "landing" && !user && (
          <div style={{ paddingTop: "20vh", textAlign: "center", paddingBottom: 60 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 72, fontWeight: 900, margin: "0 0 4px", color: C.gold, letterSpacing: -3, lineHeight: 1 }}>dime</h1>
            <div style={{ fontSize: 13, color: C.sub, letterSpacing: 3, fontWeight: 600, marginBottom: 40, fontStyle: "italic" }}>"dee-meh" — talk to me</div>
            <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.7, maxWidth: 300, margin: "0 auto 36px" }}>Learn conversational Spanish & German. Start neutral. Unlock advanced.</p>

            {/* Auth form */}
            <div style={{ textAlign: "left", maxWidth: 320, margin: "0 auto" }}>
              {authScreen === "signup" && (
                <input value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Your name" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, fontFamily: "inherit", marginBottom: 10, boxSizing: "border-box" }} />
              )}
              <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email" type="email" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, fontFamily: "inherit", marginBottom: 10, boxSizing: "border-box" }} />
              <input value={authPass} onChange={(e) => setAuthPass(e.target.value)} placeholder="Password" type="password" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" }} />
              {authErr && <div style={{ color: C.red, fontSize: 12, marginBottom: 10 }}>{authErr}</div>}
              <Btn primary onClick={authScreen === "login" ? handleLogin : handleSignup}>{authScreen === "login" ? "Log In" : "Create Account"}</Btn>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button onClick={() => { setAuthScreen(authScreen === "login" ? "signup" : "login"); setAuthErr(""); }} style={{ background: "none", border: "none", color: C.sub, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  {authScreen === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
            </div>

            <div style={{ fontSize: 10, color: C.muted, marginTop: 48, letterSpacing: 1 }}>Built by The Premise</div>
          </div>
        )}

        {/* ═══ LANGUAGE SELECT ═══ */}
        {scr === "langselect" && (
          <div style={{ paddingTop: 48, textAlign: "center", paddingBottom: 60 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 900, margin: "0 0 4px", color: C.gold, letterSpacing: -2 }}>dime</h1>
            <div style={{ fontSize: 12, color: C.sub, letterSpacing: 3, marginBottom: 36, fontStyle: "italic" }}>"dee-meh" — talk to me</div>

            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>Choose your language</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320, margin: "0 auto" }}>
              {Object.entries(LANGS).map(([key, val]) => (
                <button key={key} onClick={() => { if (!val.coming) { setLang(key); setScr("home"); } }} disabled={val.coming} style={{
                  background: val.coming ? "rgba(255,255,255,0.01)" : C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14,
                  cursor: val.coming ? "not-allowed" : "pointer", opacity: val.coming ? 0.3 : 1,
                  width: "100%", color: "inherit", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 28 }}>{val.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{val.name}</div>
                    <div style={{ fontSize: 11, color: C.sub }}>{val.label}</div>
                  </div>
                  {val.coming && <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>COMING SOON</span>}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 32 }}>
              <button onClick={handleLogout} style={{ background: "none", border: "none", color: C.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 }}>LOG OUT</button>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 24, letterSpacing: 1 }}>Built by The Premise</div>
          </div>
        )}

        {/* ═══ HOME ═══ */}
        {scr === "home" && (
          <div style={{ paddingTop: 36, paddingBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, margin: 0, color: C.gold, letterSpacing: -1 }}>dime</h1>
                <button onClick={() => setScr("langselect")} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 18, cursor: "pointer" }}>{LANGS[lang].flag}</button>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ icon: "?", fn: () => setModal("how") }, { icon: prog.sound !== false ? "♪" : "✕", fn: () => saveProg({ ...prog, sound: prog.sound === false ? true : false }) }, { icon: "↗", fn: doShare }].map((b, i) => (
                  <button key={i} onClick={b.fn} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, width: 34, height: 34, color: C.sub, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>{b.icon}</button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[{ l: "XP", v: lp.xp || 0, c: C.gold }, { l: "STREAK", v: `${lp.streak || 0}🔥`, c: "#F97316" }, { l: "RANK", v: r.l, c: C.cyan }].map((s, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, flex: 1, textAlign: "center", padding: "14px 8px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.c, fontFamily: "'Playfair Display', serif" }}>{s.v}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2.5, color: C.muted, marginTop: 3 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, opacity: 0.7 }}>{r.t}{r.n && <span style={{ opacity: 0.4, marginLeft: 8 }}>· {r.n - (lp.xp || 0)} to next</span>}</div>
              {(lp.ta || 0) > 0 && <div style={{ fontSize: 11, color: C.muted }}>{Math.round((lp.tc || 0) / lp.ta * 100)}% acc</div>}
            </div>

            {/* Must-pass toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "10px 14px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.sub }}>Must pass all to advance</div>
              <button onClick={() => setMustPass(!mustPass)} style={{ background: mustPass ? C.gold : "rgba(255,255,255,0.06)", border: "none", borderRadius: 100, width: 42, height: 24, cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: mustPass ? 21 : 3, transition: "all 0.2s" }} />
              </button>
            </div>

            {/* Levels */}
            {lang === "es" && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.muted, marginBottom: 10 }}>LATIN AMERICAN SPANISH</div>}
            {lang === "de" && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.muted, marginBottom: 10 }}>STANDARD GERMAN</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: lang === "es" ? 24 : 32 }}>
              {LEVELS.slice(0, lang === "es" ? 10 : LEVELS.length).map((lv, i) => {
                const u = unlk(i), d = lp.done.includes(i), h = lp.hi?.[i];
                return (
                  <button key={i} onClick={() => u && go(i)} disabled={!u} style={{ background: d ? "rgba(232,168,56,0.03)" : C.card, border: d ? "1px solid rgba(232,168,56,0.12)" : `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: u ? "pointer" : "not-allowed", opacity: u ? 1 : 0.25, textAlign: "left", transition: "all 0.15s", width: "100%", color: "inherit", fontFamily: "inherit" }}>
                    <div style={{ fontSize: 22, width: 34, textAlign: "center" }}>{lv.icon}</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: d ? C.gold : C.text }}>{lv.name}</div><div style={{ fontSize: 11, color: C.sub }}>{lv.desc}</div></div>
                    {d && h && <div style={{ fontSize: 9, fontWeight: 700, color: C.gold, background: "rgba(232,168,56,0.08)", padding: "3px 10px", borderRadius: 100 }}>{h}</div>}
                    {!u && <span style={{ fontSize: 13, opacity: 0.5 }}>🔒</span>}
                  </button>
                );
              })}
            </div>

            {/* Caribbean section for Spanish */}
            {lang === "es" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "rgba(6,182,212,0.4)" }}>🇵🇷 CARIBBEAN / PR</div>
                  {lp.done.filter((l) => l <= 9).length < 10 && <div style={{ fontSize: 9, color: C.muted }}>Complete all 10 to unlock</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 32 }}>
                  {LEVELS.slice(10).map((lv, i) => {
                    const idx = i + 10, u = unlk(idx), d = lp.done.includes(idx), h = lp.hi?.[idx];
                    return (
                      <button key={idx} onClick={() => u && go(idx)} disabled={!u} style={{ background: d ? "rgba(6,182,212,0.03)" : C.card, border: d ? "1px solid rgba(6,182,212,0.12)" : `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: u ? "pointer" : "not-allowed", opacity: u ? 1 : 0.25, textAlign: "left", transition: "all 0.15s", width: "100%", color: "inherit", fontFamily: "inherit" }}>
                        <div style={{ fontSize: 22, width: 34, textAlign: "center" }}>{lv.icon}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: d ? C.cyan : C.text }}>{lv.name}</div><div style={{ fontSize: 11, color: C.sub }}>{lv.desc}</div></div>
                        {d && h && <div style={{ fontSize: 9, fontWeight: 700, color: C.cyan, background: "rgba(6,182,212,0.08)", padding: "3px 10px", borderRadius: 100 }}>{h}</div>}
                        {!u && <span style={{ fontSize: 13, opacity: 0.5 }}>🔒</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <button onClick={handleLogout} style={{ background: "none", border: "none", color: C.muted, fontSize: 10, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 }}>LOG OUT</button>
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: C.muted, marginTop: 16, letterSpacing: 1 }}>Built by The Premise</div>
          </div>
        )}

        {/* ═══ PLAY ═══ */}
        {scr === "play" && cq && (
          <div style={{ paddingTop: 28, paddingBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <button onClick={() => setScr("home")} style={{ background: C.card, border: "none", borderRadius: 10, padding: "7px 14px", color: C.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 }}>✕ QUIT</button>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {cmb > 1 && <div style={{ fontSize: 12, fontWeight: 800, color: "#F97316" }}>{cmb}x🔥</div>}
                <div style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{pts}</div>
              </div>
            </div>

            <div style={{ height: 3, background: C.card, borderRadius: 100, marginBottom: 28, overflow: "hidden" }}><div style={{ height: "100%", width: `${(qi / qs.length) * 100}%`, background: `linear-gradient(90deg, ${C.gold}, #D97706)`, borderRadius: 100, transition: "width 0.4s ease" }} /></div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: C.muted }}>{LEVELS[lvl]?.icon} {LEVELS[lvl]?.name.toUpperCase()}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{qi + 1}/{qs.length}</div>
            </div>

            <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 100, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16, background: cq.type === "translate" ? "rgba(232,168,56,0.08)" : cq.type === "fillblank" ? "rgba(6,182,212,0.08)" : "rgba(249,115,22,0.08)", color: cq.type === "translate" ? C.gold : cq.type === "fillblank" ? C.cyan : "#F97316" }}>
              {cq.type === "translate" ? "TRANSLATE" : cq.type === "fillblank" ? "FILL IN BLANK" : "SCENARIO"}
            </div>

            <div style={{ fontSize: cq.q.length > 50 ? 18 : 23, fontWeight: 800, lineHeight: 1.35, marginBottom: 28, color: "#F5F3FA", fontFamily: "'Playfair Display', serif" }}>{cq.q}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {cq.options.map((o, i) => {
                const iS = sel === o, iC = o === cq.a;
                let bg = C.card, bd = `1px solid ${C.border}`, tc = C.text;
                if (show && iC) { bg = "rgba(16,185,129,0.06)"; bd = "1px solid rgba(16,185,129,0.25)"; tc = C.green; }
                else if (show && iS) { bg = "rgba(239,68,68,0.06)"; bd = "1px solid rgba(239,68,68,0.25)"; tc = C.red; }
                return (
                  <button key={i} onClick={() => pick(o)} disabled={show} style={{ background: bg, border: bd, borderRadius: 12, padding: "13px 16px", fontSize: o.length > 40 ? 12 : 14, fontWeight: 600, color: tc, cursor: show ? "default" : "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit", lineHeight: 1.4, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: show && iC ? "rgba(16,185,129,0.1)" : show && iS ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0, color: show && iC ? C.green : show && iS ? C.red : C.muted }}>
                      {show && iC ? "✓" : show && iS && !iC ? "✕" : String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ flex: 1 }}>{o}</span>
                    {show && iC && <button onClick={(e) => { e.stopPropagation(); speak(o, speechLang); }} style={{ background: "rgba(16,185,129,0.08)", border: "none", borderRadius: 7, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🔊</button>}
                  </button>
                );
              })}
            </div>

            {/* Explanation + phonetic after answer */}
            {show && (
              <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(232,168,56,0.04)", border: `1px solid rgba(232,168,56,0.1)`, borderRadius: 10 }}>
                {cq.ph && <div style={{ fontSize: 12, color: C.gold, fontStyle: "italic", marginBottom: 4 }}>🔊 {cq.ph}</div>}
                {cq.ex && <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{cq.ex}</div>}
              </div>
            )}
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {scr === "results" && (
          <div style={{ paddingTop: 48, paddingBottom: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>{pts >= qs.length * 10 * 0.9 ? "🔥" : pts >= qs.length * 10 * 0.7 ? "🤎" : pts >= qs.length * 10 * 0.5 ? "🤎" : "📚"}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, margin: "0 0 4px", color: C.gold }}>
              {pts >= qs.length * 10 * 0.9 ? (lang === "es" ? "¡Brutal!" : "Fantastisch!") : pts >= qs.length * 10 * 0.7 ? (lang === "es" ? "¡Bien hecho!" : "Gut gemacht!") : pts >= qs.length * 10 * 0.5 ? "Getting there" : "Keep going"}
            </h2>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 28 }}>{LEVELS[lvl]?.icon} {LEVELS[lvl]?.name}</div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 42, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: C.gold }}>{pts}</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, color: C.muted, marginTop: 2 }}>POINTS</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 18 }}>
                {[{ v: res.filter((r) => r.ok).length, l: "CORRECT", c: C.green }, { v: res.filter((r) => !r.ok).length, l: "WRONG", c: C.red }, { v: `${lp.streak || 0}🔥`, l: "STREAK", c: "#F97316" }].map((s, i) => (
                  <div key={i}><div style={{ fontSize: 17, fontWeight: 800, color: s.c }}>{s.v}</div><div style={{ fontSize: 8, color: C.muted, letterSpacing: 1 }}>{s.l}</div></div>
                ))}
              </div>
            </div>

            {/* Mistakes review with explanations */}
            {res.some((r) => !r.ok) && (
              <div style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.08)", borderRadius: 14, padding: 18, textAlign: "left", marginBottom: 20 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.red, marginBottom: 10 }}>REVIEW</div>
                {res.filter((r) => !r.ok).map((r, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: i < res.filter((x) => !x.ok).length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ fontSize: 11, color: C.sub, marginBottom: 2 }}>{r.q}</div>
                    <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ color: C.red, textDecoration: "line-through" }}>{r.you}</span>
                      <span style={{ color: C.muted }}>→</span>
                      <span style={{ color: C.green, fontWeight: 700 }}>{r.ans}</span>
                      <button onClick={() => speak(r.ans, speechLang)} style={{ background: "rgba(16,185,129,0.06)", border: "none", borderRadius: 5, width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>🔊</button>
                    </div>
                    {r.ph && <div style={{ fontSize: 11, color: C.gold, fontStyle: "italic" }}>🔊 {r.ph}</div>}
                    {r.ex && <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.4, marginTop: 2 }}>{r.ex}</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {/* Retry missed questions */}
              {res.some((r) => !r.ok) && (
                <Btn primary onClick={retryMissed}>Retry Missed Questions ({res.filter((r) => !r.ok).length})</Btn>
              )}
              <Btn onClick={() => go(lvl)}>Play Full Level Again</Btn>
              {lvl + 1 < LEVELS.length && unlk(lvl + 1) && (!mustPass || !res.some((r) => !r.ok)) && (
                <Btn onClick={() => go(lvl + 1)}>Next Level →</Btn>
              )}
              {mustPass && res.some((r) => !r.ok) && (
                <div style={{ fontSize: 11, color: C.red, padding: 8 }}>Clear all questions to unlock next level</div>
              )}
              <Btn onClick={doShare} style={{ background: "rgba(255,255,255,0.02)" }}>Share Progress ↗</Btn>
              <button onClick={() => setScr("home")} style={{ background: "none", border: "none", padding: 12, fontSize: 12, color: C.muted, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 }}>BACK TO LEVELS</button>
            </div>
          </div>
        )}

        {/* ═══ HOW TO PLAY MODAL ═══ */}
        {modal === "how" && (
          <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.94)", backdropFilter: "blur(16px)", overflowY: "auto", padding: "56px 28px 40px" }}>
            <div style={{ maxWidth: 400, margin: "0 auto" }}>
              <button onClick={() => setModal(null)} style={{ position: "fixed", top: 16, right: 16, background: C.card, border: "none", borderRadius: 10, width: 34, height: 34, color: C.sub, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 501 }}>✕</button>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, marginBottom: 24, color: C.gold }}>How to play</h2>
              {[
                { i: "🔤", t: "Translate", d: "English word → pick the Spanish/German translation." },
                { i: "✏️", t: "Fill in the Blank", d: "Complete the sentence with the missing word." },
                { i: "🎭", t: "Scenario", d: "Real-life situation. Choose your response." },
                { i: "🔊", t: "Audio + Phonetics", d: "Correct answer is spoken aloud. Phonetic pronunciation shown after each question." },
                { i: "💡", t: "Explanations", d: "Every question has a brief explanation of WHY the answer is correct." },
                { i: "🔥", t: "Combos", d: "Chain correct answers for bonus points." },
                { i: "🔒", t: "Must-Pass Mode", d: "Toggle on to require 100% before advancing. Retry only missed questions." },
                { i: "🇵🇷", t: "Caribbean (Spanish)", d: "Complete all 10 neutral levels to unlock PR dialect." },
              ].map((x, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                  <div style={{ fontSize: 20, width: 30, textAlign: "center", flexShrink: 0 }}>{x.i}</div>
                  <div><div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{x.t}</div><div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{x.d}</div></div>
                </div>
              ))}
              <div style={{ marginTop: 16 }}><Btn onClick={() => setModal(null)} style={{ borderRadius: 100 }}>Got it</Btn></div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.05)}}button:hover:not(:disabled){filter:brightness(1.08)}button:active:not(:disabled){transform:scale(.98)}*{box-sizing:border-box;margin:0;padding:0}input:focus{outline:1px solid rgba(232,168,56,0.3)}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:100px}`}</style>
    </div>
  );
}
