
import fs from 'fs'
import { utilService } from './util.service.js'
import { loggerService } from './logger.service.js'

const toys = utilService.readJsonFile('data/toy.json')

export const toyService = {
    query,
    getById,
    remove,
    save
}


function query(filterBy, sort) {
    console.log('filterBy', filterBy)
    if (!filterBy) return Promise.resolve(toys)

    let filteredToys = toys
    if (filterBy.txt) {
        const regExp = new RegExp(filterBy.txt, 'i')
        filteredToys = filteredToys.filter(toy => regExp.test(toy.name))
    }
    if (filterBy.labels && filterBy.labels[0]) {
        filteredToys = filteredToys.filter(toy => toy.labels.some(label => filterBy.labels.includes(label)))
    }

    if (filterBy.inStock) {
        filteredToys = filteredToys.filter(toy => toy.inStock === JSON.parse(filterBy.inStock))
    }

    filterBy.maxPrice = (+filterBy.maxPrice) ? +filterBy.maxPrice : Infinity
    filterBy.minPrice = (+filterBy.minPrice) ? +filterBy.minPrice : -Infinity

    filteredToys = filteredToys.filter(toy => (toy.price <= filterBy.maxPrice) && (toy.price >= filterBy.minPrice))
    filteredToys.sort((toy1, toy2) => {
        const dir = JSON.parse(sort.asc) ? 1 : -1
        if (sort.by === 'price') return (toy1.price - toy2.price) * dir
        if (sort.by === 'name') return toy1.name.localeCompare(toy2.name) * dir
    })

    return Promise.resolve(filteredToys);
}

function getById(toyId) {
    const toy = toys.find(toy => toy._id === toyId)
    return Promise.resolve(toy)
}

function remove(toyId, loggedinUser) {
    const idx = toys.findIndex(toy => toy._id === toyId)
    if (idx === -1) return Promise.reject('No Such toy')
    const toy = toys[idx]
    if (!loggedinUser.isAdmin) {
        return Promise.reject('Not your toy')
    }
    toys.splice(idx, 1)
    return _saveToysToFile()
}

function save(toy, loggedinUser) {
    if (toy._id) {
        const idx = toys.findIndex(currToy => currToy._id === toy._id)
        toys[idx] = { ...toys[idx], ...toy }
        if (!loggedinUser.isAdmin) {
            return Promise.reject('Need admin')
        }
    } else {
        toy.createdAt = new Date(Date.now());
        toy._id = utilService.makeId();
        toys.unshift(toy);
    }
    _saveToysToFile();
    return Promise.resolve(toy);
}



function _saveToysToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(toys, null, 4)
        fs.writeFile('data/toy.json', data, (err) => {
            if (err) {
                loggerService.error('Cannot write to toys file', err)
                return reject(err)
            }
            resolve()
        })
    })
}
