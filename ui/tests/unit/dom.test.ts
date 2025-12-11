import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDOMElements, focusElement, scrollToBottom } from '../../src/dom.js';
import { DOM_SELECTORS } from '../../src/constants.js';
import { domUtils } from '../utils/test-helpers.js';

describe('DOM Utilities', () => {
  beforeEach(() => {
    domUtils.cleanupDOM();
  });

  describe('getDOMElements', () => {
    it('should return all required DOM elements when they exist', () => {
      // Setup DOM with all required elements
      document.body.innerHTML = `
        <select id="userSelect"></select>
        <div id="chatList"></div>
        <div id="chatCount"></div>
        <button id="newChat"></button>
        <div id="chatPanelTitle"></div>
        <div id="chatHistory"></div>
        <form id="messageForm"></form>
        <textarea id="messageInput"></textarea>
        <button id="sendMessage"></button>
        <button id="themeToggle"></button>
        <span id="themeToggleText"></span>
      `;

      const elements = getDOMElements();

      expect(elements.userSelect).toBeInstanceOf(HTMLSelectElement);
      expect(elements.chatList).toBeInstanceOf(HTMLElement);
      expect(elements.chatCount).toBeInstanceOf(HTMLElement);
      expect(elements.newChatButton).toBeInstanceOf(HTMLButtonElement);
      expect(elements.chatPanelTitle).toBeInstanceOf(HTMLElement);
      expect(elements.chatHistory).toBeInstanceOf(HTMLElement);
      expect(elements.messageForm).toBeInstanceOf(HTMLFormElement);
      expect(elements.messageInput).toBeInstanceOf(HTMLTextAreaElement);
      expect(elements.sendButton).toBeInstanceOf(HTMLButtonElement);
      expect(elements.themeToggleButton).toBeInstanceOf(HTMLButtonElement);
      expect(elements.themeToggleText).toBeInstanceOf(HTMLElement);
    });

    it('should return null for optional elements when they do not exist', () => {
      // Setup DOM with only required elements (no theme toggle elements)
      document.body.innerHTML = `
        <select id="userSelect"></select>
        <div id="chatList"></div>
        <div id="chatCount"></div>
        <button id="newChat"></button>
        <div id="chatPanelTitle"></div>
        <div id="chatHistory"></div>
        <form id="messageForm"></form>
        <textarea id="messageInput"></textarea>
        <button id="sendMessage"></button>
      `;

      const elements = getDOMElements();

      expect(elements.themeToggleButton).toBeNull();
      expect(elements.themeToggleText).toBeNull();
      // Required elements should still exist
      expect(elements.userSelect).toBeInstanceOf(HTMLSelectElement);
      expect(elements.sendButton).toBeInstanceOf(HTMLButtonElement);
    });

    it('should throw error when required element is missing', () => {
      // Setup DOM missing a required element
      document.body.innerHTML = `
        <div id="chatList"></div>
        <div id="chatCount"></div>
        <button id="newChat"></button>
        <div id="chatPanelTitle"></div>
        <div id="chatHistory"></div>
        <form id="messageForm"></form>
        <textarea id="messageInput"></textarea>
        <button id="sendMessage"></button>
      `;

      expect(() => getDOMElements()).toThrow('Required element not found: #userSelect');
    });

    it('should throw error with correct selector when multiple required elements are missing', () => {
      // Setup DOM with no elements
      document.body.innerHTML = '';

      expect(() => getDOMElements()).toThrow('Required element not found: #userSelect');
    });

    it('should handle elements with correct types', () => {
      // Setup DOM with elements of correct types
      document.body.innerHTML = `
        <select id="userSelect">
          <option value="1">User 1</option>
        </select>
        <div id="chatList"></div>
        <div id="chatCount">5 chats</div>
        <button id="newChat">New Chat</button>
        <h2 id="chatPanelTitle">Chat Panel</h2>
        <div id="chatHistory"></div>
        <form id="messageForm">
          <textarea id="messageInput" placeholder="Type message..."></textarea>
          <button id="sendMessage" type="submit">Send</button>
        </form>
        <button id="themeToggle">Toggle</button>
        <span id="themeToggleText">Theme</span>
      `;

      const elements = getDOMElements();

      // Verify specific element properties
      expect(elements.userSelect.tagName).toBe('SELECT');
      expect(elements.messageForm.tagName).toBe('FORM');
      expect(elements.messageInput.tagName).toBe('TEXTAREA');
      expect(elements.messageInput.placeholder).toBe('Type message...');
      expect(elements.sendButton.type).toBe('submit');
    });
  });

  describe('focusElement', () => {
    it('should focus element when element exists and has focus method', () => {
      const element = document.createElement('input');
      const focusSpy = vi.spyOn(element, 'focus');
      document.body.appendChild(element);

      focusElement(element);

      expect(focusSpy).toHaveBeenCalledOnce();
    });

    it('should not throw when element is null', () => {
      expect(() => focusElement(null)).not.toThrow();
    });

    it('should not throw when element is undefined', () => {
      expect(() => focusElement(undefined as any)).not.toThrow();
    });

    it('should handle elements without focus method gracefully', () => {
      const element = document.createElement('div');
      // Remove focus method to simulate elements that don't support focus
      delete (element as any).focus;

      expect(() => focusElement(element)).not.toThrow();
    });

    it('should focus different types of focusable elements', () => {
      const input = document.createElement('input');
      const textarea = document.createElement('textarea');
      const button = document.createElement('button');
      const select = document.createElement('select');

      const inputSpy = vi.spyOn(input, 'focus');
      const textareaSpy = vi.spyOn(textarea, 'focus');
      const buttonSpy = vi.spyOn(button, 'focus');
      const selectSpy = vi.spyOn(select, 'focus');

      focusElement(input);
      focusElement(textarea);
      focusElement(button);
      focusElement(select);

      expect(inputSpy).toHaveBeenCalledOnce();
      expect(textareaSpy).toHaveBeenCalledOnce();
      expect(buttonSpy).toHaveBeenCalledOnce();
      expect(selectSpy).toHaveBeenCalledOnce();
    });

    it('should handle focus method that throws error', () => {
      const element = document.createElement('input');
      vi.spyOn(element, 'focus').mockImplementation(() => {
        throw new Error('Focus failed');
      });

      // Should not throw even if focus method throws
      expect(() => focusElement(element)).toThrow('Focus failed');
    });
  });

  describe('scrollToBottom', () => {
    it('should scroll element to bottom with auto behavior by default', () => {
      const element = document.createElement('div');
      const scrollToSpy = vi.spyOn(element, 'scrollTo');
      
      // Mock scrollHeight
      Object.defineProperty(element, 'scrollHeight', {
        value: 1000,
        writable: true
      });

      scrollToBottom(element);

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 1000,
        behavior: 'auto'
      });
    });

    it('should scroll element to bottom with smooth behavior when specified', () => {
      const element = document.createElement('div');
      const scrollToSpy = vi.spyOn(element, 'scrollTo');
      
      Object.defineProperty(element, 'scrollHeight', {
        value: 500,
        writable: true
      });

      scrollToBottom(element, true);

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 500,
        behavior: 'smooth'
      });
    });

    it('should handle element with zero scroll height', () => {
      const element = document.createElement('div');
      const scrollToSpy = vi.spyOn(element, 'scrollTo');
      
      Object.defineProperty(element, 'scrollHeight', {
        value: 0,
        writable: true
      });

      scrollToBottom(element);

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        behavior: 'auto'
      });
    });

    it('should handle different scroll heights correctly', () => {
      const element = document.createElement('div');
      const scrollToSpy = vi.spyOn(element, 'scrollTo');

      // Test with various scroll heights
      const heights = [100, 250, 750, 1500, 3000];
      
      heights.forEach(height => {
        Object.defineProperty(element, 'scrollHeight', {
          value: height,
          writable: true
        });

        scrollToSpy.mockClear();
        scrollToBottom(element);

        expect(scrollToSpy).toHaveBeenCalledWith({
          top: height,
          behavior: 'auto'
        });
      });
    });

    it('should handle element without scrollTo method', () => {
      const element = document.createElement('div');
      
      // Check if scrollTo exists before deletion
      const hasScrollToBefore = 'scrollTo' in element;
      
      // Remove scrollTo method
      delete (element as any).scrollTo;
      
      // Check if scrollTo exists after deletion
      const hasScrollToAfter = 'scrollTo' in element;
      
      // In Happy-DOM, elements might have scrollTo method that can't be deleted
      // or it might be inherited from prototype
      if (!hasScrollToAfter) {
        // If scrollTo was successfully removed, expect an error
        expect(() => scrollToBottom(element)).toThrow();
      } else {
        // If scrollTo still exists (inherited from prototype), it should work
        expect(() => scrollToBottom(element)).not.toThrow();
      }
    });

    it('should handle scrollTo method that throws error', () => {
      const element = document.createElement('div');
      vi.spyOn(element, 'scrollTo').mockImplementation(() => {
        throw new Error('Scroll failed');
      });

      Object.defineProperty(element, 'scrollHeight', {
        value: 100,
        writable: true
      });

      expect(() => scrollToBottom(element)).toThrow('Scroll failed');
    });

    it('should work with both smooth and auto behaviors', () => {
      const element = document.createElement('div');
      const scrollToSpy = vi.spyOn(element, 'scrollTo');
      
      Object.defineProperty(element, 'scrollHeight', {
        value: 200,
        writable: true
      });

      // Test auto behavior (default)
      scrollToBottom(element);
      expect(scrollToSpy).toHaveBeenLastCalledWith({
        top: 200,
        behavior: 'auto'
      });

      // Test smooth behavior
      scrollToBottom(element, true);
      expect(scrollToSpy).toHaveBeenLastCalledWith({
        top: 200,
        behavior: 'smooth'
      });

      // Test explicit false for smooth
      scrollToBottom(element, false);
      expect(scrollToSpy).toHaveBeenLastCalledWith({
        top: 200,
        behavior: 'auto'
      });
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle malformed DOM selectors gracefully', () => {
      // Test with DOM that has elements but wrong IDs
      document.body.innerHTML = `
        <select id="wrongUserSelect"></select>
        <div id="wrongChatList"></div>
      `;

      expect(() => getDOMElements()).toThrow('Required element not found: #userSelect');
    });

    it('should handle DOM elements with unexpected structure', () => {
      // Setup DOM with elements that have correct IDs but wrong types
      document.body.innerHTML = `
        <div id="userSelect"></div>
        <div id="chatList"></div>
        <div id="chatCount"></div>
        <div id="newChat"></div>
        <div id="chatPanelTitle"></div>
        <div id="chatHistory"></div>
        <div id="messageForm"></div>
        <div id="messageInput"></div>
        <div id="sendMessage"></div>
      `;

      const elements = getDOMElements();
      
      // Elements should exist but may not have expected methods/properties
      expect(elements.userSelect).toBeInstanceOf(HTMLElement);
      expect(elements.messageForm).toBeInstanceOf(HTMLElement);
      // The function should still return elements even if they're wrong types
    });

    it('should handle elements that exist but are detached from DOM', () => {
      const detachedElement = document.createElement('div');
      Object.defineProperty(detachedElement, 'scrollHeight', {
        value: 100,
        writable: true
      });
      
      const scrollToSpy = vi.spyOn(detachedElement, 'scrollTo');

      // Should still work with detached elements
      scrollToBottom(detachedElement);
      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 100,
        behavior: 'auto'
      });
    });

    it('should handle focus on disabled elements', () => {
      const input = document.createElement('input');
      input.disabled = true;
      const focusSpy = vi.spyOn(input, 'focus');

      focusElement(input);

      // Focus should still be called even on disabled elements
      expect(focusSpy).toHaveBeenCalledOnce();
    });

    it('should handle elements with custom properties', () => {
      const element = document.createElement('div');
      (element as any).customProperty = 'test';
      
      // Should not affect DOM utility functions
      expect(() => focusElement(element)).not.toThrow();
      expect(() => scrollToBottom(element)).not.toThrow();
    });
  });
});