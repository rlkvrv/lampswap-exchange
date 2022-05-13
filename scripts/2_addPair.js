const { ethers } = require("hardhat");

const DECIMALS = BigInt(10 ** 18);
const AMOUNT_1 = BigInt(1000000n * DECIMALS);
const AMOUNT_2 = BigInt(2000000n * DECIMALS);
const AMOUNT_3 = BigInt(3000000n * DECIMALS);

const factoryAbi = require('../artifacts/contracts/Factory.sol/Factory.json').abi;
const registryAbi = require('../artifacts/contracts/Registry.sol/Registry.json').abi;

// Нужно вставить актуальные адреса
const factoryAddress = '0xDbd8bdedb04a3EAF8F8FA30A86210858b1D4236F'
const registryAddress = '0xb29D81e9c098c5135CF0AFCec0B3ed21B35Ea803'

// Эта транзакция создает должна создать три токена для тестов
// и добавить пару через фабрику

async function main() {
    const [signer] = await ethers.getSigners();

    // создаем два токена от имени signer2
    const LampTokenA = await ethers.getContractFactory('ERC20Token', signer);
    const tokenA = await (await LampTokenA.deploy("LampTokenA", "LTA", AMOUNT_1)).deployed();
    const LampTokenB = await ethers.getContractFactory('ERC20Token', signer);
    const tokenB = await (await LampTokenB.deploy("LampTokenB", "LTB", AMOUNT_2)).deployed();
    const LampTokenC = await ethers.getContractFactory('ERC20Token', signer);
    const tokenC = await (await LampTokenC.deploy("LampTokenC", "LTC", AMOUNT_3)).deployed();

    //  Создаем пару через фабрику
    const deployedFactory = new ethers.Contract(factoryAddress, factoryAbi, signer);
    await deployedFactory.createPair(tokenA.address, tokenB.address);

    // Получаем адрес пары
    const deployedRegistry = new ethers.Contract(registryAddress, registryAbi, signer);
    const pairAddress = await deployedRegistry.getPair(tokenA.address, tokenB.address);

    console.log('\nADDRESS tokenA: ', tokenA.address);
    console.log('ADDRESS tokenB: ', tokenB.address);
    console.log('ADDRESS tokenC: ', tokenC.address);

    console.log('ADDRESS Pair (AB): ', pairAddress);

    console.log('\nmyWallet tokenA: ', await tokenA.balanceOf(signer.address));
    console.log('myWallet tokenB: ', await tokenB.balanceOf(signer.address));
    console.log('myWallet tokenC: ', await tokenC.balanceOf(signer.address));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });




