import { expect } from "chai";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import { Voting } from "../../src/types";

export function testVoting(): void {
  // deploy the contracts
  before(async function () {
    const votingArtifact: Artifact = await artifacts.readArtifact("Voting");
    this.voting = <Voting>await waffle.deployContract(this.signers.owner, votingArtifact);
    await this.voting.deployed();
  });

  describe("Starts the vote", function () {
    // candidates's address generating randomly for upcoming tests
    const candidate1 = "0x063b41d042E1dDD660f59b22a691b4E13cef07F3";
    const candidate2 = "0x7C41dfc2f26F138c2cFda5963c8b3AA21F1De2A8";
    const candidate3 = "0xc8cF938744c0894Ea2EDbFC4afec81405F459316";
    const candidate4 = "0x3322462ed0E9e3c11bD544616a2D613858Fc3d30";
    const candidate5 = "0x3B1492ef82f30388b814119e646df8637eA7DAED";

    const closure = 86400 * 1; // 1 day

    it("should be correctly started", async function () {
      await expect(this.voting.connect(this.signers.other).start(closure)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );

      await expect(this.voting.connect(this.signers.owner).start(closure)).to.emit(this.voting, "Started");
    });

    describe("Add the candidates", function () {
      it("should add the candidates correctly", async function () {
        await expect(this.voting.connect(this.signers.other).addCandidate(candidate1, 1)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
        await expect(
          this.voting.connect(this.signers.owner).addCandidate(ethers.constants.AddressZero, 1),
        ).to.be.revertedWith("Voting: address not valid");

        await expect(this.voting.connect(this.signers.owner).addCandidate(candidate1, 1))
          .to.emit(this.voting, "CandidateAdded")
          .withArgs(candidate1); // added
        await expect(this.voting.connect(this.signers.owner).addCandidate(candidate1, 1)).to.be.revertedWith(
          "Voting: candidate already exist",
        );

        await expect(this.voting.connect(this.signers.owner).addCandidate(candidate2, 2))
          .to.emit(this.voting, "CandidateAdded")
          .withArgs(candidate2); // added
        await expect(this.voting.connect(this.signers.owner).addCandidate(candidate3, 3))
          .to.emit(this.voting, "CandidateAdded")
          .withArgs(candidate3); // added
        await expect(this.voting.connect(this.signers.owner).addCandidate(candidate4, 4))
          .to.emit(this.voting, "CandidateAdded")
          .withArgs(candidate4); // added
        await expect(this.voting.connect(this.signers.owner).addCandidate(candidate5, 5))
          .to.emit(this.voting, "CandidateAdded")
          .withArgs(candidate5); // added, to be removed
      });

      it("should remove the specific candidate correctly", async function () {
        await expect(this.voting.connect(this.signers.other).removeCandidate(candidate5)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );

        await expect(this.voting.connect(this.signers.owner).removeCandidate(candidate5))
          .to.emit(this.voting, "CandidateRemoved")
          .withArgs(candidate5); // removed

        await expect(this.voting.connect(this.signers.owner).removeCandidate(candidate5)).to.be.revertedWith(
          "Voting: candidate not found",
        );
      });

      it("should returns the correct list", async function () {
        expect(await this.voting.connect(this.signers.owner).getCandidates()).to.include.members([
          candidate1,
          candidate2,
          candidate3,
          candidate4,
        ]);
      });

      describe("Vote candidates", function () {
        // candidate1: 1 vote; candidate2: 1 vote, candidate3: 3 vote; candidate4: 3 vote
        // should win the candidate4 for the major seniority

        it("should vote correctly", async function () {
          await expect(this.voting.connect(this.signers.voter1).vote(candidate1))
            .to.emit(this.voting, "Voted")
            .withArgs(this.signers.voter1.address, candidate1);
          await expect(this.voting.connect(this.signers.voter2).vote(candidate4))
            .to.emit(this.voting, "Voted")
            .withArgs(this.signers.voter2.address, candidate4);
          await expect(this.voting.connect(this.signers.voter3).vote(candidate2))
            .to.emit(this.voting, "Voted")
            .withArgs(this.signers.voter3.address, candidate2);
          await expect(this.voting.connect(this.signers.voter4).vote(candidate3))
            .to.emit(this.voting, "Voted")
            .withArgs(this.signers.voter4.address, candidate3);
          await expect(this.voting.connect(this.signers.voter5).vote(candidate4))
            .to.emit(this.voting, "Voted")
            .withArgs(this.signers.voter5.address, candidate4);
          await expect(this.voting.connect(this.signers.voter6).vote(candidate3))
            .to.emit(this.voting, "Voted")
            .withArgs(this.signers.voter6.address, candidate3);
          await expect(this.voting.connect(this.signers.voter7).vote(candidate4))
            .to.emit(this.voting, "Voted")
            .withArgs(this.signers.voter7.address, candidate4);
          await expect(this.voting.connect(this.signers.voter8).vote(candidate3))
            .to.emit(this.voting, "Voted")
            .withArgs(this.signers.voter8.address, candidate3);

          // voter1 has already voted and retry to vote
          await expect(this.voting.connect(this.signers.voter8).vote(candidate3)).to.be.revertedWith(
            "Voting: user has already voted",
          );
        });

        describe("Determine the winner", function () {
          const currentTime: number = Math.floor(Date.now() / 1000);

          it("should return the correct winner", async function () {
            await expect(this.voting.connect(this.signers.owner).winner()).to.be.revertedWith(
              "Voting: voting not yet finished",
            );

            // mine a block with closure timestamp (fast forward) essentially to finish the voting
            await ethers.provider.send("evm_mine", [currentTime + closure + 100000]);

            await expect(this.voting.connect(this.signers.owner).winner())
              .to.be.emit(this.voting, "Finished")
              .withArgs(candidate4);
          });

          it("should revert if the vote is over", async function () {
            await expect(this.voting.connect(this.signers.voter1).vote(candidate1)).to.be.revertedWith(
              "Voting: voting already finished or not yet started",
            );
          });
        });
      });
    });
  });
}
