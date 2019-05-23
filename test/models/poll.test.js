require('../../models/Media/Poll');
require('sinon-mongoose');
const mongoose = require('mongoose');
const chai = require('chai');
const sinon = require('sinon');
const UserFactory = require('../factories/users');

const { expect } = chai;
const Poll = mongoose.model('Poll');

describe('Polls', () => {
  let pollSave;
  let findStub;
  let samplePoll;
  before(() => {
    samplePoll = new Poll({
      title: 'Colour?',
      multiSelect: false,
      options: [{
        text: 'red',
        usersVoted: []
      }]
    });

    pollSave = sinon.stub(Poll.prototype, 'save').resolves(this);
    findStub = sinon.stub(mongoose.Model, 'findById').resolves(samplePoll);
  });

  after(() => {
    pollSave.restore();
    findStub.restore();
  });

  describe('correctly validate', () => {
    it('if poll has no title', (done) => {
      const poll = new Poll({
        multiSelect: true,
        options: ['red, blue'],
      });

      poll.validate((err) => {
        expect(err.errors.title.message).to.equal('Path `title` is required.');
        done();
      });
    });

    it('if poll does not specify multiSelect', (done) => {
      const poll = new Poll({
        title: 'Hello',
        options: ['red', 'blue'],
      });

      poll.validate((err) => {
        expect(err.errors.multiSelect.message).to.equal('Path `multiSelect` is required.');
        done();
      });
    });

    it('if poll has more than 10 options', (done) => {
      const opt = {
        text: 'hi',
        usersVoted: [],
      };
      const poll = new Poll({
        title: 'Hello',
        multiSelect: true,
        options: [opt, opt, opt, opt, opt, opt, opt, opt, opt, opt, opt],
      });

      poll.validate((err) => {
        expect(err.errors.options.message).to.equal('Cannot have more than 10 options on poll.');
        done();
      });
    });

    it('if users have voted for multiple options when poll is not multiselect', (done) => {
      const opt = {
        text: 'hi',
        usersVoted: [UserFactory.fred._id],
      };

      const poll = new Poll({
        title: 'Hello',
        multiSelect: false,
        options: [opt, opt],
      });

      poll.validate((err) => {
        expect(err.errors.multiSelect.message).to.equal('Poll is not set to multiSelect, but users have selected multiple options.');
        done();
      });
    });

    it('if a valid poll', (done) => {
      const poll = new Poll({
        title: 'Hello',
        multiSelect: false,
        options: [{
          text: 'Option 1',
          usersVoted: [],
        }],
      });

      poll.validate((err) => {
        expect(err).to.equal(null);
        done();
      });
    });
  });

  describe('can be modified', () => {
    it('on creation', (done) => {
      const pollData = {
        title: 'What is your favourite colour',
        multiSelect: false,
        options: ['red', 'blue', 'yellow']
      }

      Poll.create(pollData).then((result) => {
        expect(result.title).to.equal(pollData.title);
        expect(result.multiSelect).to.equal(pollData.multiSelect);
        expect(result.options[0].text).to.equal(pollData.options[0]);
        expect(result.options[1].text).to.equal(pollData.options[1]);
        expect(result.options[2].text).to.equal(pollData.options[2]);
        done();
      });
    });

    it('by finding a the poll and placing a vote', (done) => {
      Poll.findAndVote(samplePoll._id, UserFactory.fred._id, samplePoll.options[0]._id).then((result) => {
        expect(result._id).to.equal(samplePoll._id);
        expect(result.options[0].usersVoted[0]).to.equal(UserFactory.fred._id);
        done();
      })
    });

    it('by finding a the poll and adding an option', (done) => {
      const newOption = 'This option was added on';

      Poll.findAndAddOption(samplePoll._id, newOption).then((result) => {
        expect(result._id).to.equal(samplePoll._id);
        expect(result.options[1].text).to.equal(newOption);
        done();
      })
    });
  });
});