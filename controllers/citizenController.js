import { allActiveServices, findService } from '../models/serviceModel.js';
import { createRequest, listCitizenRequests, getRequestDetail } from '../models/requestModel.js';
import { addDocument, listDocs } from '../models/documentModel.js';
import { createPayment } from '../models/paymentModel.js';
import { notify, listNotifications } from '../models/notificationModel.js';
import { v4 as uuid } from 'uuid';

export async function dashboard(req, res, next) {
  try {
    const [services, myReqs, notes] = await Promise.all([
      allActiveServices(),
      listCitizenRequests(req.session.user.id),
      listNotifications(req.session.user.id)
    ]);
    res.render('citizen/dashboard', { services, myReqs, notes });
  } catch (e) { next(e); }
}

export async function showApply(req, res, next) {
  try {
    const services = await allActiveServices();
    res.render('citizen/apply', { services });
  } catch (e) { next(e); }
}

export async function submitApply(req, res, next) {
  try {
    const { service_id, ...form } = req.body;
    const service = await findService(service_id);
    if (!service) throw new Error('Service not found');

    const created = await createRequest({
      citizen_id: req.session.user.id,
      service_id,
      form_data: form
    });

    // fake payment if fee > 0
    if (service.fee_cents > 0) {
      await createPayment({ request_id: created.id, amount_cents: service.fee_cents, reference: uuid() });
    }

    await notify(req.session.user.id, `Your request for "${service.name}" submitted.`);
    req.session.success = 'Request submitted successfully.';
    res.redirect('/citizen/requests/' + created.id);
  } catch (e) { next(e); }
}

export async function requestDetail(req, res, next) {
  try {
    const detail = await getRequestDetail(req.params.id);
    const docs = await listDocs(req.params.id);
    if (!detail || detail.citizen_id !== req.session.user.id) {
      req.session.error = 'Not found.';
      return res.redirect('/citizen/dashboard');
    }
    res.render('citizen/request_detail', { detail, docs });
  } catch (e) { next(e); }
}

export async function uploadDoc(req, res, next) {
  try {
    await addDocument({
      request_id: req.params.id,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      path: '/uploads/' + req.file.filename
    });
    req.session.success = 'Document uploaded.';
    res.redirect('/citizen/requests/' + req.params.id);
  } catch (e) { next(e); }
}