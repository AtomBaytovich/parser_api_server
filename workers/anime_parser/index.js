/*

    WARNING! Этот скрипт создан ИСКЛЮЧИТЕЛЬНО в ОБРАЗОВАТЕЛЬНЫХ целях для моего авторского ТГ-канала https://t.me/atom_baytovich.
    Никакой коммерции или цели навредить сайту! 
    Сайт (https://mintmanga.live), который используется здесь, предоставлен только в качестве примера.
    Я с уважением отношусь к этому сайту и его создателям, поэтому не стал делать парсинг всех страниц сайта.
    И, пожалуйста, не нужно ддосить этот сайт или заваливать его запросами.

*/


const fs = require('fs');
const { default: axios } = require('axios');
const cheerio = require('cheerio');
const { default: parse } = require('node-html-parser');
const { URL_ANIME } = require('../../config/consts');
const path = require('path');
// мелок - для того, чтобы делать консольки красивыми
const chalk = require('chalk');

// путь к файлу относительно проекта
const file = path.join('./workers', 'anime_parser', 'tmp.json');

// глобальная переменная хранящая в себе массив данных
let infoArrPage = [];

const optionsParse = {
    blockTextElements: {
        script: false
    }
}

// аснихронная функция получения данных со страницы
async function getDataPage(href) {
    try {
        console.log(href)
        const { data } = await axios.get(`${URL_ANIME}/${href}`);

        const $ = cheerio.load(data);
        const pageHtml = $('#mangaBox > div.leftContent').html();
        const parsePageHtml = parse(pageHtml, optionsParse)

        // получаем название c HTML DOM
        const title = parsePageHtml
            .querySelector('h1')
            .querySelector('span.name').text;
        // получаем картинку c HTML DOM
        const img = parsePageHtml
            .querySelector('.expandable')
            .querySelector('.subject-cover')
            .querySelector('.picture-fotorama').childNodes[1].attributes.src

        /*
            Год выпуска
            Автор
            Жанр
            и т.д.
        */
        const infoHtml = parsePageHtml
            .querySelector('.expandable')
            .querySelector('.subject-meta')
            .querySelectorAll('p.elementList')
        // трансформируем массив с удалением символов \n
        let arrInfoText = infoHtml.map(el => {
            return el.text.replace(/\n/g, '')
        })
        // получим полностью описание
        const descHtml = parsePageHtml.querySelector('.manga-description').childNodes[1].text;

        return {
            title,
            href,
            img,
            arrInfoText,
            descHtml
        }

    } catch (error) {
        console.log(error)
    }
}

async function mainParseAnime(count = 1) {
    try {
        // делаем запрос на страницу сайта с query параметров фильтра (По дате создания)
        const { data } = await axios.get(`${URL_ANIME}/list`, {
            params: {
                'sortType': 'DATE_CREATE'
            }
        });

        // загружаем html документ для Cheerio
        const $ = cheerio.load(data);

        // преобразуем в html 
        let manga = $('#mangaBox > div.leftContent > div.tiles.row').html();
        // получаем HTML разметку сайта
        const countPagesHtml = $('#mangaBox > div.leftContent > span.pagination').html();
        // парсим в JSON 
        const countPagesJson = parse(countPagesHtml, optionsParse);
        // ищем нужные данные кол-ва страниц по классу step и получаем последний объект, где требуем text
        const maxCountPages = countPagesJson.querySelectorAll('.step').pop().text;
        console.log(chalk.blue(`Страниц: ${maxCountPages}`));
        // проверяем количество парсинга страниц
        if (count > maxCountPages) count = maxCountPages;

        // парсим страничку для получения ссылок
        const root = parse(manga, optionsParse);
        const pageDataHtml = root.removeWhitespace().querySelectorAll('.tile')

        // асинхронный цикл с вызовом функции получения данных с каждой страницы
        for await (const elem of pageDataHtml) {
            const infoPage = await getDataPage(elem.querySelector('a').attributes.href)
            infoArrPage.push(infoPage)
        }
        // console.log(infoArrPage)
        // записываем данные в json файл
        fs.writeFile(file, JSON.stringify(infoArrPage), 'utf-8', (err) => {
            if (err) return console.error('Ошибка при записи файла! ', err)
            console.log(chalk.blue(`JSON успешно сформирован и записан!\nВ файле ${infoArrPage.length} записей`))
        })

    } catch (error) {
        console.log(error)
    }
}

mainParseAnime()