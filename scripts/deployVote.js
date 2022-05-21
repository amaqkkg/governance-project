const main = async () => {
  try {
    const votingContractFactory = await hre.ethers.getContractFactory("Voting");
    const votingContract = await votingContractFactory.deploy();

    console.log("Contract deployed to: ", votingContract.address);
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

main();

//vote address mumbai = 0xA86253D62920D584d007BE7De606DCF7654388e0
