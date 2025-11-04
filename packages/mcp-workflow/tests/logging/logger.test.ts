/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Logger,
  PinoLogger,
  createLogger,
  createComponentLogger,
  createWorkflowLogger,
} from '../../src/logging/logger.js';
import pino from 'pino';

describe('Logger Implementation', () => {
  describe('PinoLogger', () => {
    let logger: Logger;

    beforeEach(() => {
      // Create a silent pino instance for testing
      const pinoInstance = pino({ level: 'silent' });
      logger = new PinoLogger(pinoInstance);
    });

    it('should implement Logger interface', () => {
      expect(logger.info).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.child).toBeDefined();
    });

    it('should create child loggers', () => {
      const childLogger = logger.child({ component: 'test' });
      expect(childLogger).toBeDefined();
      expect(childLogger).toBeInstanceOf(PinoLogger);
    });

    it('should handle logging calls without errors', () => {
      expect(() => logger.info('test message')).not.toThrow();
      expect(() => logger.debug('debug message', { data: 'test' })).not.toThrow();
      expect(() => logger.error('error message', new Error('test error'))).not.toThrow();
      expect(() => logger.warn('warning message')).not.toThrow();
    });
  });

  describe('Logger Factories', () => {
    it('should create logger with default level', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(PinoLogger);
    });

    it('should create logger with specified level', () => {
      const logger = createLogger('debug');
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(PinoLogger);
    });

    it('should create logger with info level', () => {
      const logger = createLogger('info');
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(PinoLogger);
    });

    it('should create logger with warn level', () => {
      const logger = createLogger('warn');
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(PinoLogger);
    });

    it('should create component logger with default level', () => {
      const logger = createComponentLogger('TestComponent');
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(PinoLogger);
    });

    it('should create logger with error level', () => {
      const logger = createLogger('error');
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(PinoLogger);
    });

    it('should create component logger with context', () => {
      const componentLogger = createComponentLogger('TestComponent', 'debug');
      expect(componentLogger).toBeDefined();
      expect(componentLogger).toBeInstanceOf(PinoLogger);
    });
  });

  describe('Logger Compatibility', () => {
    it('should work with structured data', () => {
      const logger = createLogger('silent');

      expect(() => {
        logger.info('test message', {
          userId: 123,
          action: 'login',
          metadata: { timestamp: Date.now() },
        });
      }).not.toThrow();
    });

    it('should handle error objects properly', () => {
      const logger = createLogger('silent');
      const testError = new Error('Test error message');
      testError.stack = 'Test stack trace';

      expect(() => {
        logger.error('An error occurred', testError);
      }).not.toThrow();
    });

    it('should create child loggers with bindings', () => {
      const logger = createLogger('silent');
      const childLogger = logger.child({
        component: 'WorkflowOrchestrator',
        version: '1.0.0',
      });

      expect(childLogger).toBeDefined();
      expect(() => {
        childLogger.info('Child logger message');
      }).not.toThrow();
    });
  });

  describe('PinoLogger', () => {
    let mockPino: pino.Logger;
    let logger: PinoLogger;

    beforeEach(() => {
      // Create a mock pino instance with spies on all methods
      mockPino = {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        child: vi.fn(() => mockPino),
      } as unknown as pino.Logger;
      logger = new PinoLogger(mockPino);
    });

    describe('info method', () => {
      it('should call pino.info with message only when no data provided', () => {
        logger.info('test message');
        expect(mockPino.info).toHaveBeenCalledWith('test message');
        expect(mockPino.info).toHaveBeenCalledTimes(1);
      });

      it('should call pino.info with data and message when data provided', () => {
        const data = { userId: 123, action: 'login' };
        logger.info('test message', data);
        expect(mockPino.info).toHaveBeenCalledWith(data, 'test message');
        expect(mockPino.info).toHaveBeenCalledTimes(1);
      });
    });

    describe('debug method', () => {
      it('should call pino.debug with message only when no data provided', () => {
        logger.debug('debug message');
        expect(mockPino.debug).toHaveBeenCalledWith('debug message');
        expect(mockPino.debug).toHaveBeenCalledTimes(1);
      });

      it('should call pino.debug with data and message when data provided', () => {
        const data = { debugInfo: 'test data' };
        logger.debug('debug message', data);
        expect(mockPino.debug).toHaveBeenCalledWith(data, 'debug message');
        expect(mockPino.debug).toHaveBeenCalledTimes(1);
      });
    });

    describe('warn method', () => {
      it('should call pino.warn with message only when no data provided', () => {
        logger.warn('warning message');
        expect(mockPino.warn).toHaveBeenCalledWith('warning message');
        expect(mockPino.warn).toHaveBeenCalledTimes(1);
      });

      it('should call pino.warn with data and message when data provided', () => {
        const data = { warningType: 'deprecation' };
        logger.warn('warning message', data);
        expect(mockPino.warn).toHaveBeenCalledWith(data, 'warning message');
        expect(mockPino.warn).toHaveBeenCalledTimes(1);
      });
    });

    describe('error method', () => {
      it('should call pino.error with message only when no error provided', () => {
        logger.error('error message');
        expect(mockPino.error).toHaveBeenCalledWith('error message');
        expect(mockPino.error).toHaveBeenCalledTimes(1);
      });

      it('should call pino.error with error object when error provided', () => {
        const error = new Error('test error');
        logger.error('error message', error);
        expect(mockPino.error).toHaveBeenCalledWith({ err: error }, 'error message');
        expect(mockPino.error).toHaveBeenCalledTimes(1);
      });
    });

    describe('child method', () => {
      it('should create a new PinoLogger with child pino instance', () => {
        const bindings = { component: 'TestComponent' };
        const childLogger = logger.child(bindings);

        expect(mockPino.child).toHaveBeenCalledWith(bindings);
        expect(childLogger).toBeInstanceOf(PinoLogger);
      });
    });
  });

  describe('createWorkflowLogger', () => {
    it('should create a workflow logger and support all logging operations', () => {
      const logger = createWorkflowLogger('Orchestrator', 'silent', 'test-mcp-server');

      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(PinoLogger);

      // Verify all logging methods work without throwing
      expect(() => {
        logger.info('workflow started', { workflowId: 'test-123' });
        logger.debug('processing state', { state: 'active' });
        logger.warn('potential issue detected');
        logger.error('workflow failed', new Error('test failure'));
      }).not.toThrow();
    });

    it('should create child loggers that inherit configuration', () => {
      const logger = createWorkflowLogger('Orchestrator', 'silent');
      const childLogger = logger.child({ taskId: 'task-456' });

      expect(childLogger).toBeDefined();
      expect(childLogger).toBeInstanceOf(PinoLogger);

      // Child logger should work for all operations
      expect(() => {
        childLogger.info('child logger message');
        childLogger.debug('child debug message');
      }).not.toThrow();
    });
  });
});
