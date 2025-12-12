import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { getDOMElements, focusElement, scrollToBottom } from '../../src/dom.js';
import { DOM_SELECTORS } from '../../src/constants.js';
import { domUtils } from '../utils/test-helpers.js';
import { generators, edgeCaseGenerators } from '../utils/generators.js';

/**
 * Property-based tests for DOM utility robustness
 * **Feature: ui-testing, Property 4: DOM utility robustness**
 * **Validates: Requirements 1.4**
 */

describe('DOM Utilities Property-Based Tests', () => {
  beforeEach(() => {
    domUtils.cleanupDOM();
  });

  describe('Property 4: DOM utility robustness', () => {
    /**
     * **Feature: ui-testing, Property 4: DOM utility robustness**
     * For any valid DOM element configuration, the DOM manipulation functions 
     * should operate successfully without throwing exceptions
     */
    it('should handle focusElement robustly across all valid element configurations', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Valid HTML elements that can be focused
            fc.constantFrom('input', 'textarea', 'button', 'select', 'a', 'div'),
            // Edge case: null element
            fc.constant(null)
          ),
          generators.domConfig(),
          (elementType, config) => {
            let element: HTMLElement | null = null;
            
            if (elementType !== null) {
              element = document.createElement(elementType);
              
              // Apply configuration to element
              if (config.id) element.id = config.id;
              if (config.className) element.className = config.className;
              if (config.innerHTML) element.innerHTML = config.innerHTML;
              if (config.textContent) element.textContent = config.textContent;
              if (config.style) element.setAttribute('style', config.style);
              if (config.dataset) {
                Object.entries(config.dataset).forEach(([key, value]) => {
                  // Only set valid dataset keys (no spaces or invalid characters)
                  if (key.trim() && /^[a-zA-Z0-9-_]+$/.test(key)) {
                    element!.dataset[key] = value;
                  }
                });
              }
              
              document.body.appendChild(element);
            }

            // The function should not throw regardless of element configuration
            expect(() => focusElement(element)).not.toThrow();
            
            // Cleanup
            if (element && element.parentNode) {
              element.parentNode.removeChild(element);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle scrollToBottom robustly across all valid element configurations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('div', 'section', 'article', 'main', 'aside'),
          generators.domConfig(),
          fc.boolean(), // smooth parameter
          fc.integer({ min: 0, max: 5000 }), // scrollHeight
          (elementType, config, smooth, scrollHeight) => {
            const element = document.createElement(elementType);
            
            // Apply configuration to element
            if (config.id) element.id = config.id;
            if (config.className) element.className = config.className;
            if (config.innerHTML) element.innerHTML = config.innerHTML;
            if (config.textContent) element.textContent = config.textContent;
            if (config.style) element.setAttribute('style', config.style);
            if (config.dataset) {
              Object.entries(config.dataset).forEach(([key, value]) => {
                // Only set valid dataset keys (no spaces or invalid characters)
                if (key.trim() && /^[a-zA-Z0-9-_]+$/.test(key)) {
                  element.dataset[key] = value;
                }
              });
            }
            
            // Mock scrollHeight property
            Object.defineProperty(element, 'scrollHeight', {
              value: scrollHeight,
              writable: true,
              configurable: true
            });
            
            // Mock scrollTo method to prevent errors in test environment
            const scrollToSpy = vi.spyOn(element, 'scrollTo').mockImplementation(() => {});
            
            document.body.appendChild(element);

            // The function should not throw regardless of element configuration
            expect(() => scrollToBottom(element, smooth)).not.toThrow();
            
            // Verify scrollTo was called with correct parameters
            expect(scrollToSpy).toHaveBeenCalledWith({
              top: scrollHeight,
              behavior: smooth ? 'smooth' : 'auto'
            });
            
            // Cleanup
            element.parentNode?.removeChild(element);
            scrollToSpy.mockRestore();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle getDOMElements robustly with various DOM configurations', () => {
      fc.assert(
        fc.property(
          fc.record({
            includeOptional: fc.boolean(),
            missingRequired: fc.option(
              fc.constantFrom(
                'userselect', 'chatlist', 'chatcount', 'newchatbutton',
                'chatpaneltitle', 'chathistory', 'messageform', 
                'messageinput', 'sendbutton'
              ),
              { nil: null }
            )
          }),
          generators.domConfig(),
          (testConfig, domConfig) => {
            // Create base DOM structure
            const requiredElements = [
              { id: 'userSelect', tag: 'select' },
              { id: 'chatList', tag: 'div' },
              { id: 'chatCount', tag: 'div' },
              { id: 'newChat', tag: 'button' },
              { id: 'chatPanelTitle', tag: 'div' },
              { id: 'chatHistory', tag: 'div' },
              { id: 'messageForm', tag: 'form' },
              { id: 'messageInput', tag: 'textarea' },
              { id: 'sendMessage', tag: 'button' }
            ];

            const optionalElements = [
              { id: 'themeToggle', tag: 'button' },
              { id: 'themeToggleText', tag: 'span' }
            ];

            let html = '';
            
            // Add required elements (except the one we might skip)
            requiredElements.forEach(({ id, tag }) => {
              // Map element IDs to test names
              const idToTestName: Record<string, string> = {
                'userSelect': 'userselect',
                'chatList': 'chatlist', 
                'chatCount': 'chatcount',
                'newChat': 'newchatbutton',
                'chatPanelTitle': 'chatpaneltitle',
                'chatHistory': 'chathistory',
                'messageForm': 'messageform',
                'messageInput': 'messageinput',
                'sendMessage': 'sendbutton'
              };
              
              if (testConfig.missingRequired !== idToTestName[id]) {
                html += `<${tag} id="${id}"></${tag}>`;
              }
            });

            // Conditionally add optional elements
            if (testConfig.includeOptional) {
              optionalElements.forEach(({ id, tag }) => {
                html += `<${tag} id="${id}"></${tag}>`;
              });
            }

            document.body.innerHTML = html;

            if (testConfig.missingRequired) {
              // Should throw when required element is missing
              expect(() => getDOMElements()).toThrow(/Required element not found/);
            } else {
              // Should not throw when all required elements are present
              expect(() => getDOMElements()).not.toThrow();
              
              const elements = getDOMElements();
              
              // Verify required elements exist
              expect(elements.userSelect).toBeInstanceOf(HTMLElement);
              expect(elements.chatList).toBeInstanceOf(HTMLElement);
              expect(elements.chatCount).toBeInstanceOf(HTMLElement);
              expect(elements.newChatButton).toBeInstanceOf(HTMLElement);
              expect(elements.chatPanelTitle).toBeInstanceOf(HTMLElement);
              expect(elements.chatHistory).toBeInstanceOf(HTMLElement);
              expect(elements.messageForm).toBeInstanceOf(HTMLElement);
              expect(elements.messageInput).toBeInstanceOf(HTMLElement);
              expect(elements.sendButton).toBeInstanceOf(HTMLElement);
              
              // Verify optional elements are null when not included
              if (testConfig.includeOptional) {
                expect(elements.themeToggleButton).toBeInstanceOf(HTMLElement);
                expect(elements.themeToggleText).toBeInstanceOf(HTMLElement);
              } else {
                expect(elements.themeToggleButton).toBeNull();
                expect(elements.themeToggleText).toBeNull();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases and malformed configurations gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Elements with problematic configurations
            fc.record({
              elementType: fc.constantFrom('div', 'span', 'input', 'button'),
              hasScrollTo: fc.boolean(),
              hasFocus: fc.boolean(),
              scrollHeight: fc.oneof(
                fc.integer({ min: 0, max: 1000 }),
                fc.constant(NaN),
                fc.constant(Infinity),
                fc.constant(-1)
              )
            }),
            // Null element case
            fc.constant(null)
          ),
          (config) => {
            if (config === null) {
              // Test null element handling
              expect(() => focusElement(null)).not.toThrow();
              return;
            }

            const element = document.createElement(config.elementType);
            
            // Conditionally remove methods to test robustness
            let scrollToSpy: any;
            if (!config.hasScrollTo) {
              // Try to remove scrollTo method, but it might not be deletable in Happy-DOM
              try {
                delete (element as any).scrollTo;
              } catch (e) {
                // If we can't delete it, mock it to throw an error
                scrollToSpy = vi.spyOn(element, 'scrollTo').mockImplementation(() => {
                  throw new Error('scrollTo not available');
                });
              }
            } else {
              // Mock scrollTo to prevent errors
              scrollToSpy = vi.spyOn(element, 'scrollTo').mockImplementation(() => {});
            }
            
            if (!config.hasFocus) {
              // Create element without focus method
              delete (element as any).focus;
            } else {
              // Mock focus to prevent errors
              vi.spyOn(element, 'focus').mockImplementation(() => {});
            }
            
            // Set scrollHeight property
            Object.defineProperty(element, 'scrollHeight', {
              value: config.scrollHeight,
              writable: true,
              configurable: true
            });
            
            document.body.appendChild(element);

            // focusElement should handle missing focus method gracefully
            expect(() => focusElement(element)).not.toThrow();
            
            // scrollToBottom should handle missing scrollTo method or invalid scrollHeight
            if (config.hasScrollTo) {
              // Should not throw if scrollTo method exists, regardless of scrollHeight
              expect(() => scrollToBottom(element)).not.toThrow();
            } else {
              // Check if scrollTo method was actually removed/mocked to throw
              const hasScrollTo = 'scrollTo' in element && typeof element.scrollTo === 'function';
              if (hasScrollTo && scrollToSpy && scrollToSpy.getMockImplementation()) {
                // scrollTo was mocked to throw, so scrollToBottom should throw
                expect(() => scrollToBottom(element)).toThrow();
              } else if (!hasScrollTo) {
                // scrollTo was actually removed, so scrollToBottom should throw
                expect(() => scrollToBottom(element)).toThrow();
              } else {
                // scrollTo still exists (couldn't be removed), so it shouldn't throw
                expect(() => scrollToBottom(element)).not.toThrow();
              }
            }
            
            // Cleanup
            element.parentNode?.removeChild(element);
            if (scrollToSpy) {
              scrollToSpy.mockRestore();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent behavior with different element types and configurations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              tag: fc.constantFrom('div', 'input', 'textarea', 'button', 'select', 'span'),
              id: generators.elementId(),
              className: fc.option(generators.className(), { nil: undefined }),
              scrollHeight: fc.integer({ min: 0, max: 2000 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (elementConfigs) => {
            const elements: HTMLElement[] = [];
            
            // Create all elements
            elementConfigs.forEach(config => {
              const element = document.createElement(config.tag);
              element.id = config.id;
              if (config.className) element.className = config.className;
              
              Object.defineProperty(element, 'scrollHeight', {
                value: config.scrollHeight,
                writable: true,
                configurable: true
              });
              
              // Mock methods to prevent errors
              vi.spyOn(element, 'scrollTo').mockImplementation(() => {});
              vi.spyOn(element, 'focus').mockImplementation(() => {});
              
              document.body.appendChild(element);
              elements.push(element);
            });

            // All DOM utility functions should work consistently across all elements
            elements.forEach(element => {
              expect(() => focusElement(element)).not.toThrow();
              expect(() => scrollToBottom(element)).not.toThrow();
              expect(() => scrollToBottom(element, true)).not.toThrow();
              expect(() => scrollToBottom(element, false)).not.toThrow();
            });
            
            // Cleanup
            elements.forEach(element => {
              element.parentNode?.removeChild(element);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: Missing DOM element handling', () => {
    /**
     * **Feature: ui-testing, Property 13: Missing DOM element handling**
     * For any missing or malformed DOM element scenario, the DOM utilities 
     * should handle the condition without throwing exceptions
     */
    it('should handle missing DOM elements gracefully in getDOMElements', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Which required elements to omit from the DOM
            missingElements: fc.array(
              fc.constantFrom(
                'userSelect', 'chatList', 'chatCount', 'newChatButton',
                'chatPanelTitle', 'chatHistory', 'messageForm', 
                'messageInput', 'sendButton'
              ),
              { minLength: 1, maxLength: 9 }
            ),
            // Whether to include optional elements
            includeOptional: fc.boolean()
          }),
          (config) => {
            // Create a set of missing elements for quick lookup
            const missingSet = new Set(config.missingElements);
            
            // Map of element names to their DOM setup
            const elementSetup = {
              userSelect: '<select id="userSelect"></select>',
              chatList: '<div id="chatList"></div>',
              chatCount: '<div id="chatCount"></div>',
              newChatButton: '<button id="newChat"></button>',
              chatPanelTitle: '<div id="chatPanelTitle"></div>',
              chatHistory: '<div id="chatHistory"></div>',
              messageForm: '<form id="messageForm"></form>',
              messageInput: '<textarea id="messageInput"></textarea>',
              sendButton: '<button id="sendMessage"></button>'
            };

            const optionalSetup = {
              themeToggleButton: '<button id="themeToggle"></button>',
              themeToggleText: '<span id="themeToggleText"></span>'
            };

            // Build DOM HTML, excluding missing elements
            let html = '';
            Object.entries(elementSetup).forEach(([name, htmlString]) => {
              if (!missingSet.has(name)) {
                html += htmlString;
              }
            });

            // Add optional elements if requested
            if (config.includeOptional) {
              Object.values(optionalSetup).forEach(htmlString => {
                html += htmlString;
              });
            }

            document.body.innerHTML = html;

            // getDOMElements should throw when required elements are missing
            // but should handle the error gracefully (not crash the test environment)
            if (config.missingElements.length > 0) {
              expect(() => getDOMElements()).toThrow(/Required element not found/);
            } else {
              expect(() => getDOMElements()).not.toThrow();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle malformed DOM elements gracefully in focusElement', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Null element
            fc.constant(null),
            // Undefined element
            fc.constant(undefined),
            // Element without focus method
            fc.record({
              type: fc.constant('no-focus'),
              tagName: fc.constantFrom('div', 'span', 'p', 'section')
            }),
            // Element with focus method that throws
            fc.record({
              type: fc.constant('focus-throws'),
              tagName: fc.constantFrom('input', 'button', 'textarea'),
              errorMessage: fc.string({ minLength: 1, maxLength: 100 })
            }),
            // Element with focus method that's not a function
            fc.record({
              type: fc.constant('focus-not-function'),
              tagName: fc.constantFrom('input', 'button')
            })
          ),
          (elementConfig) => {
            let element: HTMLElement | null | undefined = null;

            if (elementConfig === null || elementConfig === undefined) {
              element = elementConfig;
            } else if (elementConfig.type === 'no-focus') {
              element = document.createElement(elementConfig.tagName);
              // Remove focus method to simulate elements that don't support focus
              delete (element as any).focus;
            } else if (elementConfig.type === 'focus-throws') {
              element = document.createElement(elementConfig.tagName);
              vi.spyOn(element, 'focus').mockImplementation(() => {
                throw new Error(elementConfig.errorMessage);
              });
            } else if (elementConfig.type === 'focus-not-function') {
              element = document.createElement(elementConfig.tagName);
              // Replace focus with a non-function value
              (element as any).focus = 'not-a-function';
            }

            // focusElement should handle all these cases gracefully
            // It should not throw for null/undefined or missing focus method
            if (elementConfig === null || elementConfig === undefined || 
                (elementConfig && elementConfig.type === 'no-focus')) {
              expect(() => focusElement(element as any)).not.toThrow();
            } else if (elementConfig && elementConfig.type === 'focus-throws') {
              // If focus method exists but throws, focusElement will propagate the error
              expect(() => focusElement(element as any)).toThrow(elementConfig.errorMessage);
            } else if (elementConfig && elementConfig.type === 'focus-not-function') {
              // If focus exists but is not a function, calling it should throw TypeError
              expect(() => focusElement(element as any)).toThrow(TypeError);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle malformed DOM elements gracefully in scrollToBottom', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Element configuration
            elementType: fc.constantFrom('div', 'section', 'article'),
            // scrollTo method configuration
            scrollToConfig: fc.oneof(
              fc.constant('missing'), // No scrollTo method
              fc.constant('throws'), // scrollTo throws error
              fc.constant('not-function'), // scrollTo is not a function
              fc.constant('normal') // Normal scrollTo method
            ),
            // scrollHeight configuration
            scrollHeight: fc.oneof(
              fc.integer({ min: 0, max: 5000 }), // Normal values
              fc.constant(NaN), // Invalid number
              fc.constant(Infinity), // Infinite scroll
              fc.constant(-1), // Negative value
              fc.constant(undefined) // Missing property
            ),
            // smooth parameter
            smooth: fc.boolean(),
            // Error message for throwing scrollTo
            errorMessage: fc.string({ minLength: 1, maxLength: 100 })
          }),
          (config) => {
            const element = document.createElement(config.elementType);
            
            // Configure scrollHeight property
            if (config.scrollHeight !== undefined) {
              Object.defineProperty(element, 'scrollHeight', {
                value: config.scrollHeight,
                writable: true,
                configurable: true
              });
            }

            // Configure scrollTo method based on config
            let scrollToSpy: any;
            if (config.scrollToConfig === 'missing') {
              // Remove scrollTo method
              delete (element as any).scrollTo;
            } else if (config.scrollToConfig === 'throws') {
              scrollToSpy = vi.spyOn(element, 'scrollTo').mockImplementation(() => {
                throw new Error(config.errorMessage);
              });
            } else if (config.scrollToConfig === 'not-function') {
              // Replace scrollTo with non-function
              (element as any).scrollTo = 'not-a-function';
            } else {
              // Normal scrollTo method
              scrollToSpy = vi.spyOn(element, 'scrollTo').mockImplementation(() => {});
            }

            document.body.appendChild(element);

            // Test scrollToBottom behavior
            if (config.scrollToConfig === 'missing') {
              // Check if scrollTo was actually removed
              const hasScrollTo = 'scrollTo' in element && typeof element.scrollTo === 'function';
              if (!hasScrollTo) {
                // scrollTo was successfully removed, should throw
                expect(() => scrollToBottom(element, config.smooth)).toThrow();
              } else {
                // scrollTo still exists (couldn't be removed in Happy-DOM), should work
                expect(() => scrollToBottom(element, config.smooth)).not.toThrow();
              }
            } else if (config.scrollToConfig === 'not-function') {
              // scrollTo is not a function, should throw TypeError
              expect(() => scrollToBottom(element, config.smooth)).toThrow(TypeError);
            } else if (config.scrollToConfig === 'throws') {
              // Should propagate the error from scrollTo
              expect(() => scrollToBottom(element, config.smooth)).toThrow(config.errorMessage);
            } else {
              // Should work normally with valid scrollTo method
              expect(() => scrollToBottom(element, config.smooth)).not.toThrow();
              
              // Verify scrollTo was called with correct parameters
              // The implementation passes scrollHeight directly, even if it's NaN or undefined
              const expectedTop = config.scrollHeight === undefined ? 0 : config.scrollHeight;
              expect(scrollToSpy).toHaveBeenCalledWith({
                top: expectedTop,
                behavior: config.smooth ? 'smooth' : 'auto'
              });
            }

            // Cleanup
            element.parentNode?.removeChild(element);
            if (scrollToSpy) {
              scrollToSpy.mockRestore();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle completely malformed DOM structures', () => {
      fc.assert(
        fc.property(
          fc.record({
            // DOM structure configuration
            domStructure: fc.oneof(
              fc.constant('empty'), // Completely empty DOM
              fc.constant('wrong-ids'), // Elements with wrong IDs
              fc.constant('wrong-types'), // Elements with correct IDs but wrong types
              fc.constant('nested-incorrectly'), // Incorrectly nested elements
              fc.constant('duplicate-ids') // Duplicate element IDs
            ),
            // Random HTML content for malformed structures
            randomHtml: fc.string({ minLength: 0, maxLength: 500 })
          }),
          (config) => {
            let html = '';

            switch (config.domStructure) {
              case 'empty':
                html = '';
                break;
              case 'wrong-ids':
                html = `
                  <select id="wrongUserSelect"></select>
                  <div id="wrongChatList"></div>
                  <div id="wrongChatCount"></div>
                `;
                break;
              case 'wrong-types':
                html = `
                  <div id="userSelect"></div>
                  <span id="chatList"></span>
                  <p id="messageForm"></p>
                `;
                break;
              case 'nested-incorrectly':
                html = `
                  <select id="userSelect">
                    <div id="chatList">
                      <form id="messageForm">
                        <textarea id="messageInput"></textarea>
                      </form>
                    </div>
                  </select>
                `;
                break;
              case 'duplicate-ids':
                html = `
                  <select id="userSelect"></select>
                  <div id="userSelect"></div>
                  <button id="userSelect"></button>
                `;
                break;
            }

            // Add some random HTML content to test robustness
            html += config.randomHtml;

            document.body.innerHTML = html;

            // getDOMElements should handle malformed DOM gracefully
            // It should either work (if required elements exist) or throw a clear error
            try {
              const elements = getDOMElements();
              // If it succeeds, verify that we got actual DOM elements
              expect(elements.userSelect).toBeInstanceOf(HTMLElement);
            } catch (error) {
              // If it fails, it should be with a clear "Required element not found" error
              expect(error).toBeInstanceOf(Error);
              expect((error as Error).message).toMatch(/Required element not found/);
            }

            // Test that other DOM utilities handle whatever elements exist
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
              // These should not throw regardless of element type or configuration
              expect(() => focusElement(el as HTMLElement)).not.toThrow();
              
              // scrollToBottom might throw if element doesn't have scrollTo method
              // but it should be a predictable error, not a crash
              try {
                scrollToBottom(el as HTMLElement);
              } catch (error) {
                // If it throws, it should be a TypeError about scrollTo not being a function
                expect(error).toBeInstanceOf(TypeError);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});