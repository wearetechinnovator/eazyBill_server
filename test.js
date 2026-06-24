const data = [
    { name: "sourav", age: 24, lang: "JS" },
    { name: "bishai", age: 25, lang: "Python" },
    { name: "Ram", age: 45, lang: "Go" },
    { name: "Sam", age: 32, lang: "Dart" },
    { name: "Jodu", age: 24, lang: "Python" },
    { name: "Modhu", age: 20, lang: "JS" },
    { name: "Jhone", age: 32, lang: "JS" },
    { name: "Jhane", age: 30, lang: "JS" }
];

//{Js:[{ name: "Jhane", age: 30, lang: "JS" }] }
const group = data.reduce((acc, i) => {
    if (!acc[i.lang]) acc[i.lang] = [];

    acc[i.lang].push(i);
    return acc;
}, {});

console.log(group)
