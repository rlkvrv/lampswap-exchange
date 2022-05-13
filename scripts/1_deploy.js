const { ethers } = require("hardhat");

const factoryAbi = require('../artifacts/contracts/Factory.sol/Factory.json').abi;
const routerAbi = require('../artifacts/contracts/Router.sol/Router.json').abi;
const registryAbi = require('../artifacts/contracts/Registry.sol/Registry.json').abi;

async function main() {
    const [signer] = await ethers.getSigners();

    // Шаг первый:
    //  - деплой фабрики
    //  - деплой роутра
    //  - деплой регистри
    //  - деплой контракта с комиссиями

    const Factory = await ethers.getContractFactory('Factory', signer);
    const factory = await (await Factory.deploy()).deployed();
    console.log('Factory address: ', factory.address);

    const Router = await ethers.getContractFactory('Router', signer);
    const router = await (await Router.deploy()).deployed();
    console.log('Router address: ', router.address);

    const Registry = await ethers.getContractFactory("Registry", signer);
    const registry = await (await Registry.deploy()).deployed();
    console.log('Registry address: ', registry.address);

    const Fee = await ethers.getContractFactory("Fee", signer);
    const fee = await (await Fee.deploy(1, 1, 2)).deployed();
    console.log('Fee address: ', fee.address);

    const deployedRouter = new ethers.Contract(router.address, routerAbi, signer);
    const deployedFactory = new ethers.Contract(factory.address, factoryAbi, signer);
    const deployedRegistry = new ethers.Contract(registry.address, registryAbi, signer);

    //Шаг второй:
    //  - устанавливаем на роутере адрес регистри
    await deployedRouter.setRegistry(registry.address);
    //  - устанавливаем на фабрике адреса регистри, роутера и контракта комиссий
    await deployedFactory.setRouter(router.address);
    await deployedFactory.setRegistry(registry.address);
    await deployedFactory.setFee(fee.address);
    //  - устанавливаем на регистри адрес фабрики
    await deployedRegistry.setFactory(factory.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });