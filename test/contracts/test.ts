import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import { Signers } from "../types";
import { testVoting } from "./voting.behavior";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.other = signers[1];
    this.signers.voter1 = signers[2];
    this.signers.voter2 = signers[3];
    this.signers.voter3 = signers[4];
    this.signers.voter4 = signers[5];
    this.signers.voter5 = signers[6];
    this.signers.voter6 = signers[7];
    this.signers.voter7 = signers[8];
    this.signers.voter8 = signers[9];
  });

  describe("Voting", function () {
    testVoting();
  });
});
