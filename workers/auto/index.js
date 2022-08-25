/*

    WARNING! Этот скрипт создан ИСКЛЮЧИТЕЛЬНО в ОБРАЗОВАТЕЛЬНЫХ целях для моего авторского ТГ-канала https://t.me/atom_baytovich.
    Никакой коммерции или цели навредить сайту! 
    Сайт (https://alconauto.ru/), который используется здесь, предоставлен только в качестве примера.
    Я с уважением отношусь к этому сайту и его создателям, поэтому не стал делать парсинг всех страниц сайта.
    И, пожалуйста, не нужно ддосить этот сайт или заваливать его запросами.

    Также хотелось бы отметить ОШИБКИ этого сайта, а именно:
    Политика CORS - сделайте свой API доступным только для своих сервисов
    LIMIT на выдачу записей с Базы Данных. Допустим, не больше 120 штук за раз, если указано больше. 

*/

const { default: axios } = require('axios');
const XLSX = require("xlsx");
const { URL_AUTO } = require('../../config/consts');
const path = require('path');
const file = path.join('./workers', 'auto', 'auto.xlsx')

/*
    В эту же функцию можно добавить и фильтры на запросы (дешевле/дороже = asc/desc)
*/

async function startParseAuto() {
    try {
        // на период 25.08.2022 можно вытянуть хоть 10 000 записей. НО! Это удар по проекту. Поэтому, этого делать мы не будем!
        const { data } = await axios.post(`${URL_AUTO}/api/frontend/search`, {
            'from': 0,
            'size': 50,
        });
        console.log(data)
        // из док-ции https://www.npmjs.com/package/xlsx
        // создаём книгу
        const workbook = XLSX.utils.book_new();
        // создаём рабочий лист из массива объектов
        // Рабочий лист представляет собой набор ячеек, в которых вы храните и обрабатываете данные. 
        const worksheet = XLSX.utils.json_to_sheet((data.data.spare_parts))
        // добавляем рабочий лист в книгу и даём ему (рабочему листу) название
        XLSX.utils.book_append_sheet(workbook, worksheet, "test")
        // запись файла в файловую систему
        await XLSX.writeFile(workbook, file);
        console.log('Успешно!')
    } catch (error) {
        console.log(error)
    }
}

startParseAuto()