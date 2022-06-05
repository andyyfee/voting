// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { Voting } from "../../src/types/contracts/Voting";
import { Voting__factory } from "../../src/types/factories/contracts/Voting__factory";

task("deploy:Contracts").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const VotingFactory: Voting__factory = <Voting__factory>await ethers.getContractFactory("Voting");
  const Voting: Voting = <Voting>await VotingFactory.deploy();
  await Voting.deployed();
  console.log("Voting deployed to: ", Voting.address);
});
