import { listOfficerQueuePaged, countOfficerRequests, getRequestDetail, updateStatus } from '../models/requestModel.js';
import { listDocs } from '../models/documentModel.js';
import { notify } from '../models/notificationModel.js';

// Dashboard for Officer
export async function dashboard(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const size = Math.min(50, Math.max(5, parseInt(req.query.size || '10', 10)));
    const offset = (page - 1) * size;

    const [queue, total] = await Promise.all([
      listOfficerQueuePaged(req.session.user, size, offset),
      countOfficerRequests(req.session.user)
    ]);

    const totalPages = Math.max(1, Math.ceil(total / size));

    res.render('officer/dashboard', { queue, page, size, total, totalPages });
  } catch (e) { next(e); }
}

//  Request detail
export async function reviewDetail(req, res, next) {
  try {
    const detail = await getRequestDetail(req.params.id);
    if (!detail) {
      req.session.error = 'Request not found.';
      return res.redirect('/officer/dashboard');
    }
    const docs = await listDocs(req.params.id);
    res.render('officer/review_detail', { detail, docs });
  } catch (e) { next(e); }
}

// Approve / Reject
export async function decide(req, res, next) {
  try {
    const { decision } = req.body; // APPROVED or REJECTED
    const updated = await updateStatus(req.params.id, decision, req.session.user.id);
    await notify(updated.citizen_id, `Your request "${updated.id}" is ${updated.status}.`);
    req.session.success = 'Decision recorded.';
    res.redirect('/officer/dashboard');
  } catch (e) { next(e); }
}
