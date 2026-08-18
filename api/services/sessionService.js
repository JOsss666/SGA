import sessionConfig from '../config/sessionConfig.js';
import sessionRepository from '../repositories/sessionRepository.js';
import SessionService from './sessionServiceCore.js';

const sessionService = new SessionService({ repository: sessionRepository, config: sessionConfig });

export default sessionService;
