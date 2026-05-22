const express = require('express');
const router = express.Router();
const {
  createGroup,
  getGroups,
  getGroupDetails,
  inviteMember,
  getGroupSettlements,
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

router.use(protect); // Secure all group routes

router.route('/')
  .post(createGroup)
  .get(getGroups);

router.route('/:id')
  .get(getGroupDetails);

router.route('/:id/members')
  .post(inviteMember);

router.route('/:id/settlements')
  .get(getGroupSettlements);

module.exports = router;
