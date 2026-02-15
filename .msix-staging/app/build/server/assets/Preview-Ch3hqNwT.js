import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { memo, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { a as workbenchStore, s as stagingStore, b as expoUrlAtom, d as setPendingChatMessage, I as IconButton, E as ExpoQrModal, f as classNames, h as getPreviewErrorHandler } from './server-build-cW6KDhQI.js';
import { useStore } from '@nanostores/react';
import '@remix-run/react';
import 'isbot';
import 'react-dom/server';
import 'node:stream';
import 'vite-plugin-node-polyfills/shims/process';
import 'ioredis';
import 'node:crypto';
import 'node:async_hooks';
import 'nanostores';
import 'js-cookie';
import 'react-dnd';
import 'react-dnd-html5-backend';
import 'remix-utils/client-only';
import 'react-toastify';
import '@remix-run/node';
import 'class-variance-authority';
import 'vite-plugin-node-polyfills/shims/buffer';
import 'openai';
import '@ai-sdk/anthropic';
import '@ai-sdk/google';
import '@ai-sdk/openai';
import 'ai';
import 'ai/mcp-stdio';
import '@modelcontextprotocol/sdk/client/streamableHttp.js';
import 'zod';
import 'jszip';
import 'crypto';
import '@aws-sdk/client-s3';
import 'llamaindex';
import 'pg';
import '@octokit/rest';
import 'neo4j-driver';
import 'rehype-sanitize';
import 'ignore';
import 'child_process';
import 'fs';
import '@webcontainer/api';
import '@radix-ui/react-tooltip';
import 'isomorphic-git';
import 'isomorphic-git/http/web';
import 'framer-motion';
import 'path-browserify';
import 'istextorbinary';
import 'diff';
import 'file-saver';
import 'date-fns';
import '@radix-ui/react-dialog';
import 'react-qrcode-logo';
import 'zustand';
import 'lucide-react';

const PortDropdown = memo(
  ({
    activePreviewIndex,
    setActivePreviewIndex,
    isDropdownOpen,
    setIsDropdownOpen,
    setHasSelectedPreview,
    previews
  }) => {
    const dropdownRef = useRef(null);
    const sortedPreviews = previews.map((previewInfo, index) => ({ ...previewInfo, index })).sort((a, b) => a.port - b.port);
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsDropdownOpen(false);
        }
      };
      if (isDropdownOpen) {
        window.addEventListener("mousedown", handleClickOutside);
      } else {
        window.removeEventListener("mousedown", handleClickOutside);
      }
      return () => {
        window.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isDropdownOpen]);
    return /* @__PURE__ */ jsxs("div", { className: "relative z-port-dropdown", ref: dropdownRef, children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "flex items-center group-focus-within:text-bolt-elements-preview-addressBar-text bg-white group-focus-within:bg-bolt-elements-preview-addressBar-background dark:bg-bolt-elements-preview-addressBar-backgroundHover rounded-full px-2 py-1 gap-1.5",
          onClick: () => setIsDropdownOpen(!isDropdownOpen),
          children: [
            /* @__PURE__ */ jsx("span", { className: "i-ph:plug text-base" }),
            previews.length > 0 && activePreviewIndex >= 0 && activePreviewIndex < previews.length ? /* @__PURE__ */ jsx("span", { className: "text-xs font-medium", children: previews[activePreviewIndex].port }) : null
          ]
        }
      ),
      isDropdownOpen && /* @__PURE__ */ jsxs("div", { className: "absolute left-0 mt-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded shadow-sm min-w-[140px] dropdown-animation", children: [
        /* @__PURE__ */ jsx("div", { className: "px-4 py-2 border-b border-bolt-elements-borderColor text-sm font-semibold text-bolt-elements-textPrimary", children: "Ports" }),
        sortedPreviews.map((preview) => /* @__PURE__ */ jsx(
          "div",
          {
            className: "flex items-center px-4 py-2 cursor-pointer hover:bg-bolt-elements-item-backgroundActive",
            onClick: () => {
              setActivePreviewIndex(preview.index);
              setIsDropdownOpen(false);
              setHasSelectedPreview(true);
            },
            children: /* @__PURE__ */ jsx(
              "span",
              {
                className: activePreviewIndex === preview.index ? "text-bolt-elements-item-contentAccent" : "text-bolt-elements-item-contentDefault group-hover:text-bolt-elements-item-contentActive",
                children: preview.port
              }
            )
          },
          preview.port
        ))
      ] })
    ] });
  }
);

const BoxModelEditor = ({ boxModel, onValueChange }) => {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const handleStartEdit = useCallback((field, currentValue) => {
    setEditingField(field);
    setEditValue(String(currentValue));
  }, []);
  const handleEndEdit = useCallback(
    (field) => {
      if (onValueChange && editValue !== "") {
        const [type, side] = field.split("-");
        const property = `${type}-${side}`;
        onValueChange(property, `${editValue}px`);
      }
      setEditingField(null);
      setEditValue("");
    },
    [editValue, onValueChange]
  );
  const handleKeyDown = useCallback(
    (e, field) => {
      if (e.key === "Enter") {
        handleEndEdit(field);
      } else if (e.key === "Escape") {
        setEditingField(null);
        setEditValue("");
      }
    },
    [handleEndEdit]
  );
  if (!boxModel) {
    return /* @__PURE__ */ jsx("div", { className: "text-bolt-elements-textSecondary text-xs text-center py-4", children: "No box model data available" });
  }
  const renderEditableValue = (field, value, textColor) => {
    if (editingField === field) {
      return /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          value: editValue,
          onChange: (e) => setEditValue(e.target.value),
          onBlur: () => handleEndEdit(field),
          onKeyDown: (e) => handleKeyDown(e, field),
          className: "w-10 h-4 text-center text-[10px] bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor rounded focus:outline-none focus:border-accent-400",
          autoFocus: true
        }
      );
    }
    const displayValue = Math.round(value);
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => handleStartEdit(field, value),
        className: `text-[10px] font-mono hover:bg-bolt-elements-background-depth-4 px-1 rounded cursor-pointer transition-colors ${textColor}`,
        title: `Click to edit ${field}`,
        children: [
          displayValue,
          "px"
        ]
      }
    );
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsxs("div", { className: "bg-orange-500/20 border border-orange-500/40 rounded p-1", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[9px] text-orange-400 font-medium absolute top-1 left-1", children: "margin" }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-center py-1", children: renderEditableValue("margin-top", boxModel.margin.top, "text-orange-300") }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center px-2 min-w-[30px]", children: renderEditableValue("margin-left", boxModel.margin.left, "text-orange-300") }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-yellow-500/20 border border-yellow-500/40 rounded p-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[9px] text-yellow-400 font-medium absolute left-8 top-8", children: "border" }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-center py-0.5", children: renderEditableValue("border-top", boxModel.border.top, "text-yellow-300") }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "flex justify-center px-1 min-w-[20px]", children: renderEditableValue("border-left", boxModel.border.left, "text-yellow-300") }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-green-500/20 border border-green-500/40 rounded p-1", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[9px] text-green-400 font-medium", children: "padding" }),
              /* @__PURE__ */ jsx("div", { className: "flex justify-center py-0.5", children: renderEditableValue("padding-top", boxModel.padding.top, "text-green-300") }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                /* @__PURE__ */ jsx("div", { className: "flex justify-center px-1 min-w-[20px]", children: renderEditableValue("padding-left", boxModel.padding.left, "text-green-300") }),
                /* @__PURE__ */ jsx("div", { className: "flex-1 bg-blue-500/30 border border-blue-500/50 rounded py-3 px-2 text-center", children: /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-blue-300 font-mono", children: [
                  Math.round(boxModel.width),
                  " × ",
                  Math.round(boxModel.height)
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "flex justify-center px-1 min-w-[20px]", children: renderEditableValue("padding-right", boxModel.padding.right, "text-green-300") })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex justify-center py-0.5", children: renderEditableValue("padding-bottom", boxModel.padding.bottom, "text-green-300") })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-center px-1 min-w-[20px]", children: renderEditableValue("border-right", boxModel.border.right, "text-yellow-300") })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-center py-0.5", children: renderEditableValue("border-bottom", boxModel.border.bottom, "text-yellow-300") })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center px-2 min-w-[30px]", children: renderEditableValue("margin-right", boxModel.margin.right, "text-orange-300") })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-center py-1", children: renderEditableValue("margin-bottom", boxModel.margin.bottom, "text-orange-300") })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 text-[10px] justify-center pt-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-3 h-3 bg-orange-500/30 border border-orange-500/50 rounded" }),
        /* @__PURE__ */ jsx("span", { className: "text-bolt-elements-textSecondary", children: "Margin" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-3 h-3 bg-yellow-500/30 border border-yellow-500/50 rounded" }),
        /* @__PURE__ */ jsx("span", { className: "text-bolt-elements-textSecondary", children: "Border" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-3 h-3 bg-green-500/30 border border-green-500/50 rounded" }),
        /* @__PURE__ */ jsx("span", { className: "text-bolt-elements-textSecondary", children: "Padding" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-3 h-3 bg-blue-500/30 border border-blue-500/50 rounded" }),
        /* @__PURE__ */ jsx("span", { className: "text-bolt-elements-textSecondary", children: "Content" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "border-t border-bolt-elements-borderColor pt-2", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-bolt-elements-background-depth-3 rounded p-2 border border-bolt-elements-borderColor", children: [
        /* @__PURE__ */ jsx("span", { className: "text-bolt-elements-textSecondary block text-[10px]", children: "Box Sizing" }),
        /* @__PURE__ */ jsx("span", { className: "text-bolt-elements-textPrimary font-mono text-[11px]", children: boxModel.boxSizing })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-bolt-elements-background-depth-3 rounded p-2 border border-bolt-elements-borderColor", children: [
        /* @__PURE__ */ jsx("span", { className: "text-bolt-elements-textSecondary block text-[10px]", children: "Border Style" }),
        /* @__PURE__ */ jsx("span", { className: "text-bolt-elements-textPrimary font-mono text-[11px]", children: boxModel.borderStyle || "none" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("p", { className: "text-bolt-elements-textTertiary text-[10px] text-center italic", children: "Click any value to edit • Changes will be applied with AI" })
  ] });
};

const quickActions = [
  {
    id: "center",
    icon: "i-ph:align-center-horizontal",
    label: "Center",
    description: "Center this element",
    generatePrompt: (element) => {
      const selector = buildSelector(element);
      return `Please center the element \`${selector}\` both horizontally and vertically within its parent container. Use flexbox or grid for modern centering.`;
    }
  },
  {
    id: "responsive",
    icon: "i-ph:devices",
    label: "Responsive",
    description: "Make responsive",
    generatePrompt: (element) => {
      const selector = buildSelector(element);
      return `Please make the element \`${selector}\` fully responsive. Add appropriate media queries or use relative units (%, rem, vw/vh) so it adapts well to mobile, tablet, and desktop screens.`;
    }
  },
  {
    id: "add-animation",
    icon: "i-ph:sparkle",
    label: "Animate",
    description: "Add animation",
    generatePrompt: (element) => {
      const selector = buildSelector(element);
      return `Please add a subtle, professional CSS animation to the element \`${selector}\`. Consider a fade-in, slide-in, or gentle hover effect that enhances the user experience without being distracting.`;
    }
  },
  {
    id: "improve-spacing",
    icon: "i-ph:arrows-out",
    label: "Spacing",
    description: "Improve spacing",
    generatePrompt: (element) => {
      const selector = buildSelector(element);
      const boxModel = element.boxModel;
      const currentSpacing = boxModel ? `Current margin: ${boxModel.margin.top}px ${boxModel.margin.right}px ${boxModel.margin.bottom}px ${boxModel.margin.left}px, padding: ${boxModel.padding.top}px ${boxModel.padding.right}px ${boxModel.padding.bottom}px ${boxModel.padding.left}px` : "";
      return `Please improve the spacing (margin and padding) of the element \`${selector}\` to create better visual hierarchy and breathing room. ${currentSpacing}. Adjust these values for better aesthetics while maintaining consistency with the overall design.`;
    }
  },
  {
    id: "accessibility",
    icon: "i-ph:eye",
    label: "A11y",
    description: "Improve accessibility",
    generatePrompt: (element) => {
      const selector = buildSelector(element);
      const tagName = element.tagName.toLowerCase();
      return `Please improve the accessibility of the element \`${selector}\` (${tagName}). Consider adding:
- Appropriate ARIA labels and roles if needed
- Sufficient color contrast
- Focus states for interactive elements
- Screen reader friendly content
- Keyboard navigation support if applicable`;
    }
  },
  {
    id: "add-shadow",
    icon: "i-ph:drop-half-bottom",
    label: "Shadow",
    description: "Add shadow effect",
    generatePrompt: (element) => {
      const selector = buildSelector(element);
      return `Please add a subtle, modern box-shadow to the element \`${selector}\` to create depth and elevation. Use a soft shadow that works well with both light and dark themes.`;
    }
  },
  {
    id: "rounded-corners",
    icon: "i-ph:square",
    label: "Round",
    description: "Add rounded corners",
    generatePrompt: (element) => {
      const selector = buildSelector(element);
      return `Please add appropriate border-radius to the element \`${selector}\` to give it nicely rounded corners. Choose a radius that fits the overall design aesthetic.`;
    }
  },
  {
    id: "duplicate",
    icon: "i-ph:copy",
    label: "Duplicate",
    description: "Duplicate element",
    generatePrompt: (element) => {
      const selector = buildSelector(element);
      return `Please duplicate the element \`${selector}\` and place the copy right after the original. Keep all the same styling and content.`;
    }
  }
];
function buildSelector(element) {
  const parts = [element.tagName.toLowerCase()];
  if (element.id) {
    parts.push(`#${element.id}`);
  }
  if (element.className) {
    const firstClass = element.className.split(" ")[0];
    if (firstClass) {
      parts.push(`.${firstClass}`);
    }
  }
  return parts.join("");
}
const AiQuickActions = ({ selectedElement, onAIAction }) => {
  const handleAction = useCallback(
    (action) => {
      if (!selectedElement) {
        return;
      }
      const prompt = action.generatePrompt(selectedElement);
      onAIAction(prompt);
    },
    [selectedElement, onAIAction]
  );
  if (!selectedElement) {
    return null;
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-bolt-elements-textSecondary", children: [
      /* @__PURE__ */ jsx("div", { className: "i-ph:magic-wand w-3.5 h-3.5 text-accent-400" }),
      /* @__PURE__ */ jsx("span", { children: "Quick AI Actions" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-1.5", children: quickActions.map((action) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => handleAction(action),
        className: "flex flex-col items-center gap-1 p-2 rounded-lg bg-[#2D3748] border border-bolt-elements-borderColor hover:border-accent-500/50 hover:bg-bolt-elements-background-depth-4 transition-all group",
        title: action.description,
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: `${action.icon} w-4 h-4 text-bolt-elements-textSecondary group-hover:text-accent-400 transition-colors`
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary", children: action.label })
        ]
      },
      action.id
    )) }),
    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-bolt-elements-textTertiary text-center italic", children: "Click an action to send the request to AI" })
  ] });
};

const TreeNode = memo(
  ({
    element,
    isActive = false,
    indent = 0,
    onClick,
    icon
  }) => {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick,
        className: `w-full text-left px-2 py-1.5 text-xs font-mono rounded transition-all flex items-center gap-1.5 ${isActive ? "bg-accent-500/20 text-accent-400 border border-accent-500/30" : "hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"}`,
        style: { paddingLeft: `${indent * 12 + 8}px` },
        title: element.selector,
        children: [
          icon && /* @__PURE__ */ jsx("span", { className: `${icon} w-3 h-3 opacity-60` }),
          /* @__PURE__ */ jsx("span", { className: "text-blue-400", children: element.tagName }),
          element.id && /* @__PURE__ */ jsxs("span", { className: "text-green-400", children: [
            "#",
            element.id
          ] }),
          element.classes.length > 0 && !element.id && /* @__PURE__ */ jsxs("span", { className: "text-yellow-400 truncate", children: [
            ".",
            element.classes[0]
          ] }),
          element.hasChildren && /* @__PURE__ */ jsx("span", { className: "text-bolt-elements-textTertiary ml-auto", children: "›" })
        ]
      }
    );
  }
);
TreeNode.displayName = "TreeNode";
const ElementTreeNavigator = memo(({ hierarchy, onSelectElement }) => {
  const handleSelect = useCallback(
    (selector) => {
      onSelectElement?.(selector);
    },
    [onSelectElement]
  );
  if (!hierarchy || !hierarchy.current) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-bolt-elements-textTertiary text-xs", children: [
      /* @__PURE__ */ jsx("div", { className: "i-ph:tree-structure w-8 h-8 mx-auto mb-2 opacity-40" }),
      /* @__PURE__ */ jsx("p", { children: "Select an element to view its tree" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    hierarchy.parents.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-bolt-elements-textTertiary uppercase tracking-wide mb-1", children: [
        /* @__PURE__ */ jsx("span", { className: "i-ph:arrow-up w-3 h-3" }),
        "Parents"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border-l-2 border-bolt-elements-borderColor ml-1.5 pl-1", children: hierarchy.parents.map((parent, index) => /* @__PURE__ */ jsx(
        TreeNode,
        {
          element: parent,
          indent: index,
          onClick: () => handleSelect(parent.selector),
          icon: "i-ph:folder-simple"
        },
        `parent-${index}`
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-accent-400 uppercase tracking-wide mb-1", children: [
        /* @__PURE__ */ jsx("span", { className: "i-ph:cursor-click w-3 h-3" }),
        "Selected"
      ] }),
      /* @__PURE__ */ jsx(TreeNode, { element: hierarchy.current, isActive: true, indent: hierarchy.parents.length, icon: "i-ph:crosshair" })
    ] }),
    hierarchy.children.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-bolt-elements-textTertiary uppercase tracking-wide mb-1", children: [
          /* @__PURE__ */ jsx("span", { className: "i-ph:arrow-down w-3 h-3" }),
          "Children"
        ] }),
        hierarchy.totalChildren > hierarchy.children.length && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-bolt-elements-textTertiary", children: [
          "+",
          hierarchy.totalChildren - hierarchy.children.length,
          " more"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border-l-2 border-accent-500/30 ml-1.5 pl-1", children: hierarchy.children.map((child, index) => /* @__PURE__ */ jsx(
        TreeNode,
        {
          element: child,
          indent: 0,
          onClick: () => handleSelect(child.selector),
          icon: "i-ph:file"
        },
        `child-${index}`
      )) })
    ] }),
    hierarchy.siblings.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-bolt-elements-textTertiary uppercase tracking-wide mb-1", children: [
          /* @__PURE__ */ jsx("span", { className: "i-ph:arrows-horizontal w-3 h-3" }),
          "Siblings"
        ] }),
        hierarchy.totalSiblings > hierarchy.siblings.length && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-bolt-elements-textTertiary", children: [
          "+",
          hierarchy.totalSiblings - hierarchy.siblings.length,
          " more"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border-l-2 border-bolt-elements-borderColor ml-1.5 pl-1 opacity-75", children: hierarchy.siblings.slice(0, 5).map((sibling, index) => /* @__PURE__ */ jsx(
        TreeNode,
        {
          element: sibling,
          indent: 0,
          onClick: () => handleSelect(sibling.selector),
          icon: "i-ph:file-dashed"
        },
        `sibling-${index}`
      )) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "pt-2 border-t border-bolt-elements-borderColor", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] text-bolt-elements-textTertiary text-center", children: "Click any element to navigate and inspect it" }) })
  ] });
});
ElementTreeNavigator.displayName = "ElementTreeNavigator";

const toHex = (color) => {
  if (color.startsWith("#")) {
    return color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
  }
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return color;
};
const isLightColor = (color) => {
  const hex = toHex(color).replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};
const PageColorPalette = memo(({ colors, onColorSelect }) => {
  const [copiedColor, setCopiedColor] = useState(null);
  const handleCopyColor = useCallback(async (color) => {
    const hex = toHex(color);
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedColor(hex);
      setTimeout(() => setCopiedColor(null), 1500);
    } catch {
      console.error("Failed to copy color");
    }
  }, []);
  const handleSelectColor = useCallback(
    (color) => {
      onColorSelect?.(toHex(color));
    },
    [onColorSelect]
  );
  if (!colors || colors.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-4 text-bolt-elements-textTertiary text-xs", children: [
      /* @__PURE__ */ jsx("div", { className: "i-ph:palette w-6 h-6 mx-auto mb-2 opacity-40" }),
      /* @__PURE__ */ jsx("p", { children: "No colors detected" })
    ] });
  }
  const uniqueColors = [...new Set(colors.map((c) => toHex(c)))].slice(0, 16);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-bolt-elements-textTertiary uppercase tracking-wide", children: [
      /* @__PURE__ */ jsx("span", { className: "i-ph:palette w-3 h-3" }),
      "Page Colors (",
      uniqueColors.length,
      ")"
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: uniqueColors.map((color, index) => {
      const hex = toHex(color);
      const isLight = isLightColor(color);
      const isCopied = copiedColor === hex;
      return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => handleCopyColor(color),
            onDoubleClick: () => handleSelectColor(color),
            className: "w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-lg relative group",
            style: {
              backgroundColor: color,
              borderColor: isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"
            },
            title: `${hex}
Click to copy, double-click to use`,
            children: [
              isCopied && /* @__PURE__ */ jsx(
                "span",
                {
                  className: `absolute inset-0 flex items-center justify-center text-xs font-bold ${isLight ? "text-gray-800" : "text-white"}`,
                  children: "✓"
                }
              ),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: `absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? "text-gray-800" : "text-white"}`,
                  children: /* @__PURE__ */ jsx("span", { className: "i-ph:copy w-4 h-4" })
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-[9px] text-bolt-elements-textTertiary font-mono truncate max-w-[44px]", children: hex.slice(1).toUpperCase() })
      ] }, `${color}-${index}`);
    }) }),
    /* @__PURE__ */ jsx("div", { className: "pt-2 border-t border-bolt-elements-borderColor", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] text-bolt-elements-textTertiary text-center", children: "Click to copy • Double-click to apply" }) })
  ] });
});
PageColorPalette.displayName = "PageColorPalette";

const ELEMENT_CATEGORIES = [
  {
    category: "Single Element",
    targets: [{ value: "current", label: "Current Element Only" }]
  },
  {
    category: "Headings",
    targets: [
      { value: "all-headings", label: "All Headings (H1-H6)" },
      { value: "h1", label: "All H1" },
      { value: "h2", label: "All H2" },
      { value: "h3", label: "All H3" },
      { value: "h4", label: "All H4" }
    ]
  },
  {
    category: "Text",
    targets: [
      { value: "all-text", label: "All Text Elements" },
      { value: "p", label: "All Paragraphs" },
      { value: "a", label: "All Links" },
      { value: "span", label: "All Spans" },
      { value: "label", label: "All Labels" }
    ]
  },
  {
    category: "Containers",
    targets: [
      { value: "all-boxes", label: "All Containers" },
      { value: "div", label: "All Divs" },
      { value: "section", label: "All Sections" },
      { value: "article", label: "All Articles" },
      { value: "aside", label: "All Asides" }
    ]
  },
  {
    category: "Lists",
    targets: [
      { value: "all-lists", label: "All Lists" },
      { value: "li", label: "All List Items" }
    ]
  }
];
const VALUE_TO_SELECTOR = {
  current: "",
  "all-headings": "h1, h2, h3, h4, h5, h6",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  "all-text": "p, span, a, label, li, td, th",
  p: "p",
  a: "a",
  span: "span",
  label: "label",
  "all-boxes": "div, section, article, aside, main, header, footer, nav",
  div: "div",
  section: "section",
  article: "article",
  aside: "aside",
  "all-lists": "ul, ol",
  li: "li"
};
const BulkStyleSelector = ({
  currentTagName,
  selectedTarget,
  onSelectTarget,
  affectedCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleSelect = useCallback(
    (value, label) => {
      if (value === "current") {
        onSelectTarget(null);
      } else if (value === "same-tag") {
        onSelectTarget({
          value: "same-tag",
          label: `All <${currentTagName}>`,
          selector: currentTagName.toLowerCase()
        });
      } else {
        onSelectTarget({
          value,
          label,
          selector: VALUE_TO_SELECTOR[value] || value
        });
      }
      setIsOpen(false);
    },
    [currentTagName, onSelectTarget]
  );
  const displayLabel = selectedTarget ? selectedTarget.label : "Current Element Only";
  const isBulkMode = selectedTarget !== null;
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setIsOpen(!isOpen),
        className: `w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs font-medium rounded border transition-colors ${isBulkMode ? "bg-purple-500/20 border-purple-500/50 text-purple-300 hover:bg-purple-500/30" : "bg-bolt-elements-background-depth-3 border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-4"}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: isBulkMode ? "i-ph:stack-bold" : "i-ph:cursor-click" }),
            /* @__PURE__ */ jsx("span", { className: "truncate", children: displayLabel })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            isBulkMode && affectedCount !== void 0 && /* @__PURE__ */ jsxs("span", { className: "text-[10px] bg-purple-500/30 px-1.5 py-0.5 rounded-full", children: [
              affectedCount,
              " elements"
            ] }),
            /* @__PURE__ */ jsx("span", { className: `transition-transform ${isOpen ? "rotate-180" : ""}`, children: /* @__PURE__ */ jsx("span", { className: "i-ph:caret-down w-3 h-3" }) })
          ] })
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "absolute top-full left-0 right-0 mt-1 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto", children: [
      ELEMENT_CATEGORIES.map((category) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "px-2 py-1 text-[10px] font-semibold text-bolt-elements-textTertiary uppercase bg-bolt-elements-background-depth-3 sticky top-0", children: category.category }),
        category.targets.map((target) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleSelect(target.value, target.label),
            className: `w-full text-left px-3 py-1.5 text-xs hover:bg-bolt-elements-background-depth-3 transition-colors ${selectedTarget?.value === target.value || target.value === "current" && !selectedTarget ? "bg-accent-500/20 text-accent-400" : "text-bolt-elements-textPrimary"}`,
            children: target.label
          },
          target.value
        ))
      ] }, category.category)),
      currentTagName && !["html", "body", "head"].includes(currentTagName.toLowerCase()) && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "px-2 py-1 text-[10px] font-semibold text-bolt-elements-textTertiary uppercase bg-bolt-elements-background-depth-3 sticky top-0", children: "Same Type" }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => handleSelect("same-tag", `All <${currentTagName}>`),
            className: `w-full text-left px-3 py-1.5 text-xs hover:bg-bolt-elements-background-depth-3 transition-colors ${selectedTarget?.value === "same-tag" ? "bg-accent-500/20 text-accent-400" : "text-bolt-elements-textPrimary"}`,
            children: [
              "All <",
              currentTagName.toLowerCase(),
              "> elements"
            ]
          }
        )
      ] })
    ] }),
    isBulkMode && /* @__PURE__ */ jsxs("div", { className: "mt-1 text-[10px] text-purple-400 flex items-center gap-1", children: [
      /* @__PURE__ */ jsx("span", { className: "i-ph:warning-circle w-3 h-3" }),
      "Changes will apply to all matching elements"
    ] })
  ] });
};

const InspectorPanel = ({
  selectedElement,
  isVisible,
  onClose,
  onStyleChange,
  onTextChange,
  onApplyWithAI,
  onDeleteElement,
  onAIAction,
  onSelectFromTree,
  onRevert,
  onBulkStyleChange,
  onBulkRevert,
  bulkAffectedCount,
  accumulatedBulkChanges,
  onApplyBulkCSS,
  onClearBulkChanges
}) => {
  const [activeTab, setActiveTab] = useState("styles");
  const [editedStyles, setEditedStyles] = useState({});
  const [editedText, setEditedText] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [bulkTarget, setBulkTarget] = useState(null);
  const handleStyleChange = useCallback(
    (property, value) => {
      console.log("[InspectorPanel] Style change:", property, value, "bulk:", bulkTarget?.selector);
      setEditedStyles((prev) => ({ ...prev, [property]: value }));
      if (bulkTarget && onBulkStyleChange) {
        onBulkStyleChange(bulkTarget.selector, property, value);
      } else {
        onStyleChange?.(property, value);
      }
    },
    [onStyleChange, onBulkStyleChange, bulkTarget]
  );
  const handleTextChange = useCallback(
    (text) => {
      console.log("[InspectorPanel] Text change:", text);
      setEditedText(text);
      onTextChange?.(text);
    },
    [onTextChange]
  );
  const hasChanges = Object.keys(editedStyles).length > 0 || editedText.length > 0;
  const generateCSS = useCallback(() => {
    if (Object.keys(editedStyles).length === 0) {
      return "";
    }
    const selector = selectedElement?.selector || selectedElement?.tagName.toLowerCase() || "element";
    const styleLines = Object.entries(editedStyles).map(([prop, value]) => `  ${prop}: ${value};`).join("\n");
    return `${selector} {
${styleLines}
}`;
  }, [editedStyles, selectedElement]);
  const handleCopyCSS = useCallback(async () => {
    const css = generateCSS();
    if (!css) {
      setCopyFeedback("No changes to copy");
      setTimeout(() => setCopyFeedback(null), 2e3);
      return;
    }
    try {
      await navigator.clipboard.writeText(css);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(null), 2e3);
    } catch {
      setCopyFeedback("Failed to copy");
      setTimeout(() => setCopyFeedback(null), 2e3);
    }
  }, [generateCSS]);
  const handleCopyAllStyles = useCallback(async () => {
    if (!selectedElement) {
      return;
    }
    const selector = selectedElement.selector || selectedElement.tagName.toLowerCase();
    const styles = getRelevantStyles(selectedElement.styles);
    if (Object.keys(styles).length === 0) {
      setCopyFeedback("No styles to copy");
      setTimeout(() => setCopyFeedback(null), 2e3);
      return;
    }
    const styleLines = Object.entries(styles).map(([prop, value]) => `  ${prop}: ${value};`).join("\n");
    const css = `${selector} {
${styleLines}
}`;
    try {
      await navigator.clipboard.writeText(css);
      setCopyFeedback("All styles copied!");
      setTimeout(() => setCopyFeedback(null), 2e3);
    } catch {
      setCopyFeedback("Failed to copy");
      setTimeout(() => setCopyFeedback(null), 2e3);
    }
  }, [selectedElement]);
  const handleApplyWithAI = useCallback(() => {
    if (!selectedElement || !hasChanges) {
      return;
    }
    onApplyWithAI?.({
      element: selectedElement,
      styles: editedStyles,
      text: editedText || void 0
    });
  }, [selectedElement, editedStyles, editedText, hasChanges, onApplyWithAI]);
  if (!isVisible || !selectedElement) {
    return null;
  }
  const getRelevantStyles = (styles) => {
    const relevantProps = [
      "color",
      "background-color",
      "background",
      "font-size",
      "font-weight",
      "font-family",
      "text-align",
      "padding",
      "margin",
      "border",
      "border-radius",
      "width",
      "height",
      "display",
      "position",
      "flex-direction",
      "justify-content",
      "align-items",
      "gap"
    ];
    return relevantProps.reduce(
      (acc, prop) => {
        const value = styles[prop];
        if (value) {
          acc[prop] = value;
        }
        return acc;
      },
      {}
    );
  };
  const isColorProperty = (prop) => {
    return prop.includes("color") || prop === "background" || prop.includes("border");
  };
  const parseColorFromValue = (value) => {
    const hexMatch = value.match(/#([0-9a-fA-F]{3,8})/);
    if (hexMatch) {
      return hexMatch[0];
    }
    const rgbMatch = value.match(/rgba?\([^)]+\)/);
    if (rgbMatch) {
      return rgbMatch[0];
    }
    return null;
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed right-4 top-20 w-80 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-lg z-[9999] max-h-[calc(100vh-6rem)] overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "i-ph:cursor-click text-accent-400" }),
        /* @__PURE__ */ jsx("h3", { className: "font-medium text-bolt-elements-textPrimary text-sm", children: "Element Inspector" })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClose,
          className: "text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors p-1 rounded hover:bg-bolt-elements-background-depth-4",
          children: /* @__PURE__ */ jsx("div", { className: "i-ph:x w-4 h-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-3 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2", children: /* @__PURE__ */ jsx("div", { className: "text-sm", children: /* @__PURE__ */ jsxs("div", { className: "font-mono text-xs bg-bolt-elements-background-depth-3 px-2 py-1.5 rounded border border-bolt-elements-borderColor", children: [
      /* @__PURE__ */ jsx("span", { className: "text-blue-400", children: selectedElement.tagName.toLowerCase() }),
      selectedElement.id && /* @__PURE__ */ jsxs("span", { className: "text-green-400", children: [
        "#",
        selectedElement.id
      ] }),
      selectedElement.className && /* @__PURE__ */ jsxs("span", { className: "text-yellow-400", children: [
        ".",
        selectedElement.className.split(" ")[0]
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "p-3 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2", children: /* @__PURE__ */ jsx(
      BulkStyleSelector,
      {
        currentTagName: selectedElement.tagName,
        selectedTarget: bulkTarget,
        onSelectTarget: setBulkTarget,
        affectedCount: bulkAffectedCount
      }
    ) }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "flex border-b border-bolt-elements-borderColor",
        style: { background: "var(--bolt-elements-bg-depth-3)" },
        children: ["styles", "text", "box", "ai", "tree", "colors"].map((tab) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveTab(tab),
            className: "flex-1 px-1.5 py-2 text-[10px] font-medium capitalize transition-colors",
            style: {
              background: activeTab === tab ? "var(--bolt-elements-bg-depth-2)" : "transparent",
              color: activeTab === tab ? "var(--color-accent-500, #3b82f6)" : "var(--bolt-elements-textSecondary)",
              borderBottom: activeTab === tab ? "2px solid var(--color-accent-500, #3b82f6)" : "2px solid transparent"
            },
            children: tab === "ai" ? "AI" : tab === "tree" ? "🌳" : tab === "colors" ? "🎨" : tab
          },
          tab
        ))
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "p-3 overflow-y-auto max-h-80 bg-bolt-elements-background-depth-2", children: [
      activeTab === "styles" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleCopyAllStyles,
            className: "w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-4 hover:text-bolt-elements-textPrimary transition-colors mb-3",
            children: [
              /* @__PURE__ */ jsx("span", { className: "i-ph:clipboard w-3.5 h-3.5" }),
              copyFeedback || "Copy All Styles"
            ]
          }
        ),
        Object.entries(getRelevantStyles(selectedElement.styles)).map(([prop, value]) => {
          const editedValue = editedStyles[prop] ?? value;
          const color = isColorProperty(prop) ? parseColorFromValue(editedValue) : null;
          return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-bolt-elements-textSecondary min-w-[100px] truncate", title: prop, children: [
              prop,
              ":"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 flex items-center gap-1", children: [
              color && /* @__PURE__ */ jsx("div", { className: "relative w-6 h-6 rounded overflow-hidden border border-bolt-elements-borderColor", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "color",
                  value: color.startsWith("#") ? color : "#000000",
                  onChange: (e) => handleStyleChange(prop, e.target.value),
                  className: "absolute inset-0 w-[200%] h-[200%] -top-1 -left-1 cursor-pointer border-0 p-0 m-0",
                  style: { background: "transparent" },
                  title: "Pick color"
                }
              ) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: editedValue,
                  onChange: (e) => handleStyleChange(prop, e.target.value),
                  className: "flex-1 bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded px-2 py-1 text-bolt-elements-textPrimary font-mono text-xs focus:outline-none focus:border-accent-400"
                }
              )
            ] })
          ] }, prop);
        }),
        Object.keys(getRelevantStyles(selectedElement.styles)).length === 0 && /* @__PURE__ */ jsx("p", { className: "text-bolt-elements-textSecondary text-xs italic", children: "No editable styles found" })
      ] }),
      activeTab === "text" && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs text-bolt-elements-textSecondary block mb-1", children: "Text Content" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: editedText || selectedElement.textContent,
              onChange: (e) => handleTextChange(e.target.value),
              className: "w-full bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded px-2 py-2 text-bolt-elements-textPrimary text-sm focus:outline-none focus:border-accent-400 resize-none",
              rows: 4,
              placeholder: "Enter text content..."
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-bolt-elements-textTertiary text-xs", children: "Changes apply instantly to the preview. Note: Only works for simple text elements." })
      ] }),
      activeTab === "box" && /* @__PURE__ */ jsx(BoxModelEditor, { boxModel: selectedElement.boxModel || null, onValueChange: handleStyleChange }),
      activeTab === "ai" && /* @__PURE__ */ jsx(
        AiQuickActions,
        {
          selectedElement,
          onAIAction: (message) => {
            onAIAction?.(message);
          }
        }
      ),
      activeTab === "tree" && /* @__PURE__ */ jsx(ElementTreeNavigator, { hierarchy: selectedElement.hierarchy || null, onSelectElement: onSelectFromTree }),
      activeTab === "colors" && /* @__PURE__ */ jsx(
        PageColorPalette,
        {
          colors: selectedElement.colors || [],
          onColorSelect: (color) => {
            handleStyleChange("background-color", color);
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-3 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-3 space-y-2", children: [
      accumulatedBulkChanges && accumulatedBulkChanges.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-2 rounded-lg border border-green-500/30 bg-green-500/5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-green-400 font-medium", children: [
            accumulatedBulkChanges.length,
            " bulk ",
            accumulatedBulkChanges.length === 1 ? "change" : "changes",
            " ",
            "pending"
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onClearBulkChanges,
              className: "text-bolt-elements-textTertiary hover:text-red-400 transition-colors",
              title: "Clear all bulk changes",
              children: /* @__PURE__ */ jsx("div", { className: "i-ph:x-circle w-4 h-4" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onApplyBulkCSS,
            className: "w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors",
            children: [
              /* @__PURE__ */ jsx("div", { className: "i-ph:code w-3.5 h-3.5" }),
              "Apply All Bulk CSS"
            ]
          }
        )
      ] }),
      hasChanges ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleCopyCSS,
              className: "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-4 transition-colors",
              children: [
                /* @__PURE__ */ jsx("div", { className: "i-ph:clipboard w-3.5 h-3.5" }),
                copyFeedback || "Copy CSS"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleApplyWithAI,
              className: "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors",
              children: [
                /* @__PURE__ */ jsx("div", { className: "i-ph:magic-wand w-3.5 h-3.5" }),
                "Apply with AI"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              if (bulkTarget && onBulkRevert) {
                onBulkRevert(bulkTarget.selector);
              } else {
                onRevert?.();
              }
              setEditedStyles({});
              setEditedText("");
            },
            className: `w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${bulkTarget ? "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50" : "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50"}`,
            children: [
              /* @__PURE__ */ jsx("div", { className: "i-ph:arrow-counter-clockwise w-3.5 h-3.5" }),
              bulkTarget ? `Revert All ${bulkTarget.label}` : "Revert Changes"
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsx("p", { className: "text-bolt-elements-textTertiary text-xs text-center", children: "Edit values above to see live changes" }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onDeleteElement?.(selectedElement),
          className: "w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors",
          children: [
            /* @__PURE__ */ jsx("div", { className: "i-ph:trash w-3.5 h-3.5" }),
            "Delete Element"
          ]
        }
      )
    ] })
  ] });
};

const getWindowSizes = (t) => [
  {
    name: t("preview.device.iphone_se", "iPhone SE"),
    width: 375,
    height: 667,
    icon: "i-ph:device-mobile",
    hasFrame: true,
    frameType: "mobile"
  },
  {
    name: t("preview.device.iphone_12_13", "iPhone 12/13"),
    width: 390,
    height: 844,
    icon: "i-ph:device-mobile",
    hasFrame: true,
    frameType: "mobile"
  },
  {
    name: t("preview.device.iphone_12_13_pro_max", "iPhone 12/13 Pro Max"),
    width: 428,
    height: 926,
    icon: "i-ph:device-mobile",
    hasFrame: true,
    frameType: "mobile"
  },
  {
    name: t("preview.device.ipad_mini", "iPad Mini"),
    width: 768,
    height: 1024,
    icon: "i-ph:device-tablet",
    hasFrame: true,
    frameType: "tablet"
  },
  {
    name: t("preview.device.ipad_air", "iPad Air"),
    width: 820,
    height: 1180,
    icon: "i-ph:device-tablet",
    hasFrame: true,
    frameType: "tablet"
  },
  {
    name: t("preview.device.ipad_pro_11", 'iPad Pro 11"'),
    width: 834,
    height: 1194,
    icon: "i-ph:device-tablet",
    hasFrame: true,
    frameType: "tablet"
  },
  {
    name: t("preview.device.ipad_pro_12_9", 'iPad Pro 12.9"'),
    width: 1024,
    height: 1366,
    icon: "i-ph:device-tablet",
    hasFrame: true,
    frameType: "tablet"
  },
  {
    name: t("preview.device.small_laptop", "Small Laptop"),
    width: 1280,
    height: 800,
    icon: "i-ph:laptop",
    hasFrame: true,
    frameType: "laptop"
  },
  {
    name: t("preview.device.laptop", "Laptop"),
    width: 1366,
    height: 768,
    icon: "i-ph:laptop",
    hasFrame: true,
    frameType: "laptop"
  },
  {
    name: t("preview.device.large_laptop", "Large Laptop"),
    width: 1440,
    height: 900,
    icon: "i-ph:laptop",
    hasFrame: true,
    frameType: "laptop"
  },
  {
    name: t("preview.device.desktop", "Desktop"),
    width: 1920,
    height: 1080,
    icon: "i-ph:monitor",
    hasFrame: true,
    frameType: "desktop"
  },
  {
    name: t("preview.device.4k_display", "4K Display"),
    width: 3840,
    height: 2160,
    icon: "i-ph:monitor",
    hasFrame: true,
    frameType: "desktop"
  }
];
const screenshotCallbacks = /* @__PURE__ */ new Map();
let globalIframeRef = null;
function requestPreviewScreenshot(options = {}, timeout = 5e3) {
  return new Promise((resolve) => {
    const requestId = `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timeoutId = setTimeout(() => {
      screenshotCallbacks.delete(requestId);
      resolve(generateFallbackScreenshot(options.width || 320, options.height || 200));
    }, timeout);
    screenshotCallbacks.set(requestId, (dataUrl, _isPlaceholder) => {
      clearTimeout(timeoutId);
      resolve(dataUrl);
    });
    if (globalIframeRef?.contentWindow) {
      globalIframeRef.contentWindow.postMessage(
        {
          type: "CAPTURE_SCREENSHOT_REQUEST",
          requestId,
          options: {
            width: options.width || 320,
            height: options.height || 200
          }
        },
        "*"
      );
    } else {
      clearTimeout(timeoutId);
      screenshotCallbacks.delete(requestId);
      resolve(generateFallbackScreenshot(options.width || 320, options.height || 200));
    }
  });
}
function generateFallbackScreenshot(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "";
  }
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, "#1a1f2e");
  bgGradient.addColorStop(1, "#0f1219");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#252a38";
  ctx.fillRect(0, 0, width, 28);
  ctx.fillStyle = "#ff5f57";
  ctx.beginPath();
  ctx.arc(12, 14, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#febc2e";
  ctx.beginPath();
  ctx.arc(28, 14, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#28c840";
  ctx.beginPath();
  ctx.arc(44, 14, 5, 0, Math.PI * 2);
  ctx.fill();
  const contentY = 38;
  ctx.fillStyle = "#2d3548";
  ctx.fillRect(0, contentY, width, 32);
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.roundRect(10, contentY + 8, 60, 16, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(20, contentY + 50, width * 0.6, 20);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(20, contentY + 78, width * 0.45, 12);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
  return canvas.toDataURL("image/png", 0.8);
}
const Preview = memo(({ setSelectedElement }) => {
  const { t } = useTranslation();
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasSelectedPreview = useRef(false);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];
  const isPreviewMode = useStore(stagingStore).isPreviewMode;
  const localPreviewUrl = (() => {
    if (!activePreview?.baseUrl) {
      return "";
    }
    const match = activePreview.baseUrl.match(/^https?:\/\/([^.]+)\.local-credentialless\.webcontainer-api\.io/);
    if (match) {
      const previewId = match[1];
      return `http://localhost:5173/webcontainer/preview/${previewId}`;
    }
    return activePreview.baseUrl;
  })();
  const [displayPath, setDisplayPath] = useState("/");
  const [iframeUrl, setIframeUrl] = useState();
  const [isInspectorMode, setIsInspectorMode] = useState(false);
  const [isDeviceModeOn, setIsDeviceModeOn] = useState(false);
  const [widthPercent, setWidthPercent] = useState(37.5);
  const [currentWidth, setCurrentWidth] = useState(0);
  const [inspectorElement, setInspectorElement] = useState(null);
  const [isInspectorPanelVisible, setIsInspectorPanelVisible] = useState(false);
  const [accumulatedBulkChanges, setAccumulatedBulkChanges] = useState([]);
  const resizingState = useRef({
    isResizing: false,
    side: null,
    startX: 0,
    startWidthPercent: 37.5,
    windowWidth: window.innerWidth,
    pointerId: null
  });
  const SCALING_FACTOR = 1;
  const windowSizes = useMemo(() => getWindowSizes(t), [t]);
  const [isWindowSizeDropdownOpen, setIsWindowSizeDropdownOpen] = useState(false);
  const [selectedWindowSize, setSelectedWindowSize] = useState(windowSizes[0]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showDeviceFrame, setShowDeviceFrame] = useState(true);
  const [showDeviceFrameInPreview, setShowDeviceFrameInPreview] = useState(false);
  const expoUrl = useStore(expoUrlAtom);
  const [isExpoQrModalOpen, setIsExpoQrModalOpen] = useState(false);
  useEffect(() => {
    if (!activePreview) {
      setIframeUrl(void 0);
      setDisplayPath("/");
      return;
    }
    const { baseUrl } = activePreview;
    setIframeUrl(baseUrl);
    setDisplayPath("/");
  }, [activePreview]);
  const findMinPortIndex = useCallback(
    (minIndex, preview, index, array) => {
      return preview.port < array[minIndex].port ? index : minIndex;
    },
    []
  );
  useEffect(() => {
    if (previews.length > 1 && !hasSelectedPreview.current) {
      const minPortIndex = previews.reduce(findMinPortIndex, 0);
      setActivePreviewIndex(minPortIndex);
    }
  }, [previews, findMinPortIndex]);
  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };
  const hardReloadPreview = useCallback(() => {
    if (iframeRef.current && iframeUrl) {
      const url = new URL(iframeUrl);
      url.searchParams.set("_t", Date.now().toString());
      iframeRef.current.src = "";
      requestAnimationFrame(() => {
        if (iframeRef.current) {
          iframeRef.current.src = url.toString();
        }
      });
    }
  }, [iframeUrl]);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.BroadcastChannel !== "function") {
      return void 0;
    }
    const channel = new BroadcastChannel("preview-updates");
    channel.onmessage = (event) => {
      const { type } = event.data;
      if (type === "hard-refresh") {
        hardReloadPreview();
      } else if (type === "file-change" || type === "refresh-preview") {
        reloadPreview();
      }
    };
    return () => {
      channel.close();
    };
  }, [hardReloadPreview, reloadPreview]);
  const toggleFullscreen = async () => {
    if (!isFullscreen && containerRef.current) {
      await containerRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);
  useEffect(() => {
    globalIframeRef = iframeRef.current;
    return () => {
      globalIframeRef = null;
    };
  });
  const toggleDeviceMode = () => {
    setIsDeviceModeOn((prev) => !prev);
  };
  const startResizing = (e, side) => {
    if (!isDeviceModeOn) {
      return;
    }
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
    resizingState.current = {
      isResizing: true,
      side,
      startX: e.clientX,
      startWidthPercent: widthPercent,
      windowWidth: window.innerWidth,
      pointerId: e.pointerId
    };
  };
  const ResizeHandle = ({ side }) => {
    if (!side) {
      return null;
    }
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: `resize-handle-${side}`,
        onPointerDown: (e) => startResizing(e, side),
        style: {
          position: "absolute",
          top: 0,
          ...side === "left" ? { left: 0, marginLeft: "-7px" } : { right: 0, marginRight: "-7px" },
          width: "15px",
          height: "100%",
          cursor: "ew-resize",
          background: "var(--bolt-elements-background-depth-4, rgba(0,0,0,.3))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s",
          userSelect: "none",
          touchAction: "none",
          zIndex: 10
        },
        onMouseOver: (e) => e.currentTarget.style.background = "var(--bolt-elements-background-depth-4, rgba(0,0,0,.3))",
        onMouseOut: (e) => e.currentTarget.style.background = "var(--bolt-elements-background-depth-3, rgba(0,0,0,.15))",
        title: "Drag to resize width",
        children: /* @__PURE__ */ jsx(GripIcon, {})
      }
    );
  };
  useEffect(() => {
    if (!isDeviceModeOn) {
      return;
    }
    const handlePointerMove = (e) => {
      const state = resizingState.current;
      if (!state.isResizing || e.pointerId !== state.pointerId) {
        return;
      }
      const dx = e.clientX - state.startX;
      const dxPercent = dx / state.windowWidth * 100 * SCALING_FACTOR;
      let newWidthPercent = state.startWidthPercent;
      if (state.side === "right") {
        newWidthPercent = state.startWidthPercent + dxPercent;
      } else if (state.side === "left") {
        newWidthPercent = state.startWidthPercent - dxPercent;
      }
      newWidthPercent = Math.max(10, Math.min(newWidthPercent, 90));
      setWidthPercent(newWidthPercent);
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const newWidth = Math.round(containerWidth * newWidthPercent / 100);
        setCurrentWidth(newWidth);
        const previewContainer = containerRef.current.querySelector('div[style*="width"]');
        if (previewContainer) {
          previewContainer.style.width = `${newWidthPercent}%`;
        }
      }
    };
    const handlePointerUp = (e) => {
      const state = resizingState.current;
      if (!state.isResizing || e.pointerId !== state.pointerId) {
        return;
      }
      const handles = document.querySelectorAll(".resize-handle-left, .resize-handle-right");
      handles.forEach((handle) => {
        if (handle.hasPointerCapture?.(e.pointerId)) {
          handle.releasePointerCapture(e.pointerId);
        }
      });
      resizingState.current = {
        ...resizingState.current,
        isResizing: false,
        side: null,
        pointerId: null
      };
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    document.addEventListener("pointermove", handlePointerMove, { passive: false });
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);
    function cleanupResizeListeners() {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
      if (resizingState.current.pointerId !== null) {
        const handles = document.querySelectorAll(".resize-handle-left, .resize-handle-right");
        handles.forEach((handle) => {
          if (handle.hasPointerCapture?.(resizingState.current.pointerId)) {
            handle.releasePointerCapture(resizingState.current.pointerId);
          }
        });
        resizingState.current = {
          ...resizingState.current,
          isResizing: false,
          side: null,
          pointerId: null
        };
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      }
    }
    return cleanupResizeListeners;
  }, [isDeviceModeOn, SCALING_FACTOR]);
  useEffect(() => {
    const handleWindowResize = () => {
      resizingState.current.windowWidth = window.innerWidth;
      if (containerRef.current && isDeviceModeOn) {
        const containerWidth = containerRef.current.clientWidth;
        setCurrentWidth(Math.round(containerWidth * widthPercent / 100));
      }
    };
    window.addEventListener("resize", handleWindowResize);
    if (containerRef.current && isDeviceModeOn) {
      const containerWidth = containerRef.current.clientWidth;
      setCurrentWidth(Math.round(containerWidth * widthPercent / 100));
    }
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [isDeviceModeOn, widthPercent]);
  useEffect(() => {
    if (containerRef.current && isDeviceModeOn) {
      const containerWidth = containerRef.current.clientWidth;
      setCurrentWidth(Math.round(containerWidth * widthPercent / 100));
    }
  }, [isDeviceModeOn]);
  const GripIcon = () => /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        pointerEvents: "none"
      },
      children: /* @__PURE__ */ jsx(
        "div",
        {
          style: {
            color: "var(--bolt-elements-textSecondary, rgba(0,0,0,0.5))",
            fontSize: "10px",
            lineHeight: "5px",
            userSelect: "none",
            marginLeft: "1px"
          },
          children: "••• •••"
        }
      )
    }
  );
  const openInNewWindow = (size) => {
    if (activePreview?.baseUrl) {
      const match = activePreview.baseUrl.match(/^https?:\/\/([^.]+)\.local-credentialless\.webcontainer-api\.io/);
      if (match) {
        const previewId = match[1];
        const previewUrl = `/webcontainer/preview/${previewId}`;
        let width = size.width;
        let height = size.height;
        if (isLandscape && (size.frameType === "mobile" || size.frameType === "tablet")) {
          width = size.height;
          height = size.width;
        }
        if (showDeviceFrame && size.hasFrame) {
          const frameWidth = size.frameType === "mobile" ? isLandscape ? 120 : 40 : 60;
          const frameHeight = size.frameType === "mobile" ? isLandscape ? 80 : 80 : isLandscape ? 60 : 100;
          const newWindow = window.open(
            "",
            "_blank",
            `width=${width + frameWidth},height=${height + frameHeight + 40},menubar=no,toolbar=no,location=no,status=no`
          );
          if (!newWindow) {
            console.error("Failed to open new window");
            return;
          }
          const frameColor = getFrameColor();
          const frameRadius = size.frameType === "mobile" ? "36px" : "20px";
          const framePadding = size.frameType === "mobile" ? isLandscape ? "40px 60px" : "40px 20px" : isLandscape ? "30px 50px" : "50px 30px";
          const notchTop = isLandscape ? "50%" : "20px";
          const notchLeft = isLandscape ? "30px" : "50%";
          const notchTransform = isLandscape ? "translateY(-50%)" : "translateX(-50%)";
          const notchWidth = isLandscape ? "8px" : size.frameType === "mobile" ? "60px" : "80px";
          const notchHeight = isLandscape ? size.frameType === "mobile" ? "60px" : "80px" : "8px";
          const homeBottom = isLandscape ? "50%" : "15px";
          const homeRight = isLandscape ? "30px" : "50%";
          const homeTransform = isLandscape ? "translateY(50%)" : "translateX(50%)";
          const homeWidth = isLandscape ? "4px" : "40px";
          const homeHeight = isLandscape ? "40px" : "4px";
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>${size.name} Preview</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  background: #f0f0f0;
                  overflow: hidden;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }

                .device-container {
                  position: relative;
                }

                .device-name {
                  position: absolute;
                  top: -30px;
                  left: 0;
                  right: 0;
                  text-align: center;
                  font-size: 14px;
                  color: #333;
                }

                .device-frame {
                  position: relative;
                  border-radius: ${frameRadius};
                  background: ${frameColor};
                  padding: ${framePadding};
                  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                  overflow: hidden;
                }

                /* Notch */
                .device-frame:before {
                  content: '';
                  position: absolute;
                  top: ${notchTop};
                  left: ${notchLeft};
                  transform: ${notchTransform};
                  width: ${notchWidth};
                  height: ${notchHeight};
                  background: #333;
                  border-radius: 4px;
                  z-index: 2;
                }

                /* Home button */
                .device-frame:after {
                  content: '';
                  position: absolute;
                  bottom: ${homeBottom};
                  right: ${homeRight};
                  transform: ${homeTransform};
                  width: ${homeWidth};
                  height: ${homeHeight};
                  background: #333;
                  border-radius: 50%;
                  z-index: 2;
                }

                iframe {
                  border: none;
                  width: ${width}px;
                  height: ${height}px;
                  background: white;
                  display: block;
                }
              </style>
            </head>
            <body>
              <div class="device-container">
                <div class="device-name">${size.name} ${isLandscape ? "(Landscape)" : "(Portrait)"}</div>
                <div class="device-frame">
                  <iframe src="${previewUrl}" sandbox="allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin" allow="cross-origin-isolated"></iframe>
                </div>
              </div>
            </body>
            </html>
          `;
          newWindow.document.open();
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        } else {
          const newWindow = window.open(
            previewUrl,
            "_blank",
            `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no`
          );
          if (newWindow) {
            newWindow.focus();
          }
        }
      } else {
        console.warn("[Preview] Invalid WebContainer URL:", activePreview.baseUrl);
      }
    }
  };
  const openInNewTab = () => {
    if (localPreviewUrl) {
      window.open(localPreviewUrl, "_blank");
    }
  };
  const getFramePadding = useCallback(() => {
    if (!selectedWindowSize) {
      return "40px 20px";
    }
    const isMobile = selectedWindowSize.frameType === "mobile";
    if (isLandscape) {
      return isMobile ? "40px 60px" : "30px 50px";
    }
    return isMobile ? "40px 20px" : "50px 30px";
  }, [isLandscape, selectedWindowSize]);
  const getDeviceScale = useCallback(() => {
    return 1;
  }, [isLandscape, selectedWindowSize, widthPercent]);
  useEffect(() => {
    return () => {
    };
  }, [isDeviceModeOn, showDeviceFrameInPreview, getDeviceScale, isLandscape, selectedWindowSize]);
  const getFrameColor = useCallback(() => {
    const isDarkMode = document.documentElement.classList.contains("dark") || document.documentElement.getAttribute("data-theme") === "dark" || window.matchMedia("(prefers-color-scheme: dark)").matches;
    return isDarkMode ? "#555" : "#111";
  }, []);
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleColorSchemeChange = () => {
      if (showDeviceFrameInPreview) {
        setShowDeviceFrameInPreview(true);
      }
    };
    darkModeMediaQuery.addEventListener("change", handleColorSchemeChange);
    return () => {
      darkModeMediaQuery.removeEventListener("change", handleColorSchemeChange);
    };
  }, [showDeviceFrameInPreview]);
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === "INSPECTOR_READY") {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: "INSPECTOR_ACTIVATE",
              active: isInspectorMode
            },
            "*"
          );
        }
      } else if (event.data.type === "INSPECTOR_CLICK") {
        const element = event.data.elementInfo;
        navigator.clipboard.writeText(element.displayText).then(() => {
          setSelectedElement?.(element);
          setInspectorElement(element);
          setIsInspectorPanelVisible(true);
        });
      } else if (event.data.type === "INSPECTOR_BULK_APPLIED") {
        setBulkAffectedCount(event.data.count);
      } else if (event.data.type === "INSPECTOR_BULK_REVERTED") {
        setBulkAffectedCount(void 0);
      } else if (event.data.type === "PREVIEW_CONSOLE_ERROR") {
        getPreviewErrorHandler().handlePreviewMessage({
          type: "PREVIEW_UNCAUGHT_EXCEPTION",
          // Use existing type for compatibility
          message: event.data.message,
          stack: event.data.stack,
          pathname: new URL(event.data.url || window.location.href).pathname,
          search: new URL(event.data.url || window.location.href).search,
          hash: new URL(event.data.url || window.location.href).hash,
          port: selectedWindowSize?.width || 0
        });
      } else if (event.data.type === "PREVIEW_VITE_ERROR") {
        getPreviewErrorHandler().handlePreviewMessage({
          type: "PREVIEW_UNCAUGHT_EXCEPTION",
          // Use existing type for compatibility
          message: event.data.fullMessage || event.data.message,
          stack: event.data.stack || "",
          pathname: new URL(event.data.url || window.location.href).pathname,
          search: new URL(event.data.url || window.location.href).search,
          hash: new URL(event.data.url || window.location.href).hash,
          port: selectedWindowSize?.width || 0
        });
      } else if (event.data.type === "PREVIEW_SCREENSHOT_RESPONSE") {
        const requestId = event.data.requestId;
        const callback = screenshotCallbacks.get(requestId);
        if (callback) {
          callback(event.data.dataUrl, event.data.isPlaceholder);
          screenshotCallbacks.delete(requestId);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isInspectorMode]);
  const toggleInspectorMode = () => {
    const newInspectorMode = !isInspectorMode;
    setIsInspectorMode(newInspectorMode);
    if (!newInspectorMode) {
      setIsInspectorPanelVisible(false);
      setInspectorElement(null);
    }
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "INSPECTOR_ACTIVATE",
          active: newInspectorMode
        },
        "*"
      );
    }
  };
  const handleStyleChange = useCallback((property, value) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "INSPECTOR_EDIT_STYLE",
          property,
          value
        },
        "*"
      );
    }
  }, []);
  const handleTextChange = useCallback((text) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "INSPECTOR_EDIT_TEXT",
          text
        },
        "*"
      );
    }
  }, []);
  const handleCloseInspectorPanel = useCallback(() => {
    setIsInspectorPanelVisible(false);
    setInspectorElement(null);
  }, []);
  const handleSelectFromTree = useCallback((selector) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "INSPECTOR_SELECT_BY_SELECTOR",
          selector
        },
        "*"
      );
    }
  }, []);
  const handleRevert = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "INSPECTOR_REVERT"
        },
        "*"
      );
    }
  }, []);
  const [bulkAffectedCount, setBulkAffectedCount] = useState(void 0);
  const handleBulkStyleChange = useCallback((selector, property, value) => {
    setAccumulatedBulkChanges((prev) => {
      const existingIndex = prev.findIndex((c) => c.selector === selector && c.property === property);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { selector, property, value };
        return updated;
      } else {
        return [...prev, { selector, property, value }];
      }
    });
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "INSPECTOR_BULK_STYLE",
          selector,
          property,
          value
        },
        "*"
      );
    }
  }, []);
  const handleBulkRevert = useCallback((selector) => {
    setAccumulatedBulkChanges((prev) => prev.filter((c) => c.selector !== selector));
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "INSPECTOR_BULK_REVERT",
          selector
        },
        "*"
      );
    }
  }, []);
  const handleApplyWithAI = useCallback(
    (changes) => {
      const { element, styles, text } = changes;
      const selectorParts = [element.tagName.toLowerCase()];
      if (element.id) {
        selectorParts.push(`#${element.id}`);
      }
      if (element.className) {
        const firstClass = element.className.split(" ")[0];
        if (firstClass) {
          selectorParts.push(`.${firstClass}`);
        }
      }
      const selector = selectorParts.join("");
      const changeLines = [];
      if (Object.keys(styles).length > 0) {
        changeLines.push("**Style changes:**");
        Object.entries(styles).forEach(([prop, value]) => {
          changeLines.push(`- ${prop}: ${value}`);
        });
      }
      if (text) {
        changeLines.push(`**Text content:** "${text}"`);
      }
      const message = `Please apply these changes to the element \`${selector}\`:

${changeLines.join("\n")}

Find this element in the source code and update its styles/text accordingly.`;
      setPendingChatMessage(message);
      setIsInspectorPanelVisible(false);
      setInspectorElement(null);
    },
    []
  );
  const handleDeleteElement = useCallback((element) => {
    const selectorParts = [element.tagName.toLowerCase()];
    if (element.id) {
      selectorParts.push(`#${element.id}`);
    }
    if (element.className) {
      const firstClass = element.className.split(" ")[0];
      if (firstClass) {
        selectorParts.push(`.${firstClass}`);
      }
    }
    const selector = selectorParts.join("");
    const textPreview = element.textContent?.slice(0, 50) || "";
    const textContext = textPreview ? ` with text "${textPreview}${element.textContent && element.textContent.length > 50 ? "..." : ""}"` : "";
    const message = `Please delete/remove the element \`${selector}\`${textContext} from the source code.

Remove this element completely from the JSX/HTML.`;
    setPendingChatMessage(message);
    setIsInspectorPanelVisible(false);
    setInspectorElement(null);
  }, []);
  const handleAIAction = useCallback((message) => {
    setPendingChatMessage(message);
    setIsInspectorPanelVisible(false);
    setInspectorElement(null);
  }, []);
  const handleApplyBulkCSS = useCallback(() => {
    if (accumulatedBulkChanges.length === 0) {
      return;
    }
    const groupedChanges = {};
    accumulatedBulkChanges.forEach(({ selector, property, value }) => {
      if (!groupedChanges[selector]) {
        groupedChanges[selector] = {};
      }
      groupedChanges[selector][property] = value;
    });
    const cssRules = Object.entries(groupedChanges).map(([selector, styles]) => {
      const styleLines = Object.entries(styles).map(([prop, value]) => `  ${prop}: ${value} !important;`).join("\n");
      return `${selector} {
${styleLines}
}`;
    }).join("\n\n");
    const fullCSS = `/* Bulk Style Changes - Applied via Inspector */
${cssRules}`;
    const message = `Please add the following CSS rules to the project's main stylesheet (or create a new style block if needed):

\`\`\`css
${fullCSS}
\`\`\`

Add these rules to style the elements as specified. The !important flags ensure these styles take precedence.`;
    setPendingChatMessage(message);
    setAccumulatedBulkChanges([]);
    setIsInspectorPanelVisible(false);
    setInspectorElement(null);
  }, [accumulatedBulkChanges]);
  const handleClearBulkChanges = useCallback(() => {
    setAccumulatedBulkChanges([]);
    if (iframeRef.current?.contentWindow) {
      const uniqueSelectors = [...new Set(accumulatedBulkChanges.map((c) => c.selector))];
      uniqueSelectors.forEach((selector) => {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "INSPECTOR_BULK_REVERT",
            selector
          },
          "*"
        );
      });
    }
  }, [accumulatedBulkChanges]);
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: `w-full h-full flex flex-col relative`, children: [
    /* @__PURE__ */ jsx(
      InspectorPanel,
      {
        selectedElement: inspectorElement,
        isVisible: isInspectorPanelVisible,
        onClose: handleCloseInspectorPanel,
        onStyleChange: handleStyleChange,
        onTextChange: handleTextChange,
        onApplyWithAI: handleApplyWithAI,
        onDeleteElement: handleDeleteElement,
        onAIAction: handleAIAction,
        onSelectFromTree: handleSelectFromTree,
        onRevert: handleRevert,
        onBulkStyleChange: handleBulkStyleChange,
        onBulkRevert: handleBulkRevert,
        bulkAffectedCount,
        accumulatedBulkChanges,
        onApplyBulkCSS: handleApplyBulkCSS,
        onClearBulkChanges: handleClearBulkChanges
      }
    ),
    isPortDropdownOpen && /* @__PURE__ */ jsx("div", { className: "z-iframe-overlay w-full h-full absolute", onClick: () => setIsPortDropdownOpen(false) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-bolt-elements-background-depth-2 p-2 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx(IconButton, { icon: "i-ph:arrow-clockwise", onClick: reloadPreview }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-grow flex items-center gap-1 bg-bolt-elements-preview-addressBar-background border border-bolt-elements-borderColor text-bolt-elements-preview-addressBar-text rounded-full px-3 py-1 text-sm hover:bg-bolt-elements-preview-addressBar-backgroundHover hover:focus-within:bg-bolt-elements-preview-addressBar-backgroundActive focus-within:bg-bolt-elements-preview-addressBar-backgroundActive focus-within-border-bolt-elements-borderColorActive focus-within:text-bolt-elements-preview-addressBar-textActive", children: [
        previews.length > 1 && /* @__PURE__ */ jsx(
          PortDropdown,
          {
            activePreviewIndex,
            setActivePreviewIndex,
            isDropdownOpen: isPortDropdownOpen,
            setHasSelectedPreview: (value) => hasSelectedPreview.current = value,
            setIsDropdownOpen: setIsPortDropdownOpen,
            previews
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            title: "Full URL",
            ref: inputRef,
            className: "w-full bg-transparent outline-none text-xs font-mono truncate",
            type: "text",
            value: localPreviewUrl || "",
            onChange: (event) => {
              if (!activePreview) {
                return;
              }
              const inputValue = event.target.value;
              if (inputValue.startsWith("http")) {
                try {
                  const url = new URL(inputValue);
                  setDisplayPath(url.pathname + url.search + url.hash || "/");
                } catch {
                }
              } else if (inputValue.startsWith("/")) {
                setDisplayPath(inputValue);
              } else {
                setDisplayPath("/" + inputValue);
              }
            },
            onKeyDown: (event) => {
              if (event.key === "Enter" && activePreview) {
                let targetPath = displayPath.trim();
                if (!targetPath.startsWith("/")) {
                  targetPath = "/" + targetPath;
                }
                const fullUrl = activePreview.baseUrl + targetPath;
                setIframeUrl(fullUrl);
                setDisplayPath(targetPath);
                if (inputRef.current) {
                  inputRef.current.blur();
                }
              }
            },
            onClick: (event) => {
              event.target.select();
            },
            disabled: !activePreview
          }
        ),
        activePreview && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: openInNewTab,
            className: "flex-shrink-0 p-1 bg-transparent text-bolt-elements-preview-addressBar-text hover:text-bolt-elements-preview-addressBar-textActive rounded transition-colors",
            title: "Open in new tab",
            children: /* @__PURE__ */ jsx("div", { className: "i-ph:arrow-square-out w-4 h-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          IconButton,
          {
            icon: "i-ph:devices",
            onClick: toggleDeviceMode,
            title: isDeviceModeOn ? "Switch to Responsive Mode" : "Switch to Device Mode"
          }
        ),
        expoUrl && /* @__PURE__ */ jsx(IconButton, { icon: "i-ph:qr-code", onClick: () => setIsExpoQrModalOpen(true), title: "Show QR" }),
        /* @__PURE__ */ jsx(ExpoQrModal, { open: isExpoQrModalOpen, onClose: () => setIsExpoQrModalOpen(false) }),
        isDeviceModeOn && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            IconButton,
            {
              icon: "i-ph:device-rotate",
              onClick: () => setIsLandscape(!isLandscape),
              title: isLandscape ? "Switch to Portrait" : "Switch to Landscape"
            }
          ),
          /* @__PURE__ */ jsx(
            IconButton,
            {
              icon: showDeviceFrameInPreview ? "i-ph:device-mobile" : "i-ph:device-mobile-slash",
              onClick: () => setShowDeviceFrameInPreview(!showDeviceFrameInPreview),
              title: showDeviceFrameInPreview ? "Hide Device Frame" : "Show Device Frame"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          IconButton,
          {
            icon: "i-ph:cursor-click",
            onClick: toggleInspectorMode,
            className: isInspectorMode ? "bg-bolt-elements-background-depth-3 !text-bolt-elements-item-contentAccent" : "",
            title: isInspectorMode ? "Disable Element Inspector" : "Enable Element Inspector"
          }
        ),
        /* @__PURE__ */ jsx(
          IconButton,
          {
            icon: isFullscreen ? "i-ph:arrows-in" : "i-ph:arrows-out",
            onClick: toggleFullscreen,
            title: isFullscreen ? "Exit Full Screen" : "Full Screen"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center relative", children: [
          /* @__PURE__ */ jsx(
            IconButton,
            {
              icon: "i-ph:list",
              onClick: () => setIsWindowSizeDropdownOpen(!isWindowSizeDropdownOpen),
              title: "New Window Options"
            }
          ),
          isWindowSizeDropdownOpen && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50", onClick: () => setIsWindowSizeDropdownOpen(false) }),
            /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 z-50 min-w-[240px] max-h-[400px] overflow-y-auto bg-white dark:bg-black rounded-xl shadow-2xl border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.1)] overflow-hidden", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-3 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.1)]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "i-ph:frame-corners h-4 w-4" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: t("preview.window_options", "Window Options") })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      className: "flex w-full justify-between items-center text-start bg-transparent text-xs text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary",
                      onClick: () => {
                        openInNewTab();
                      },
                      children: [
                        /* @__PURE__ */ jsx("span", { children: t("preview.open_new_tab", "Open in new tab") }),
                        /* @__PURE__ */ jsx("div", { className: "i-ph:arrow-square-out h-5 w-4" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      className: "flex w-full justify-between items-center text-start bg-transparent text-xs text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary",
                      onClick: () => {
                        if (!activePreview?.baseUrl) {
                          console.warn("[Preview] No active preview available");
                          return;
                        }
                        const match = activePreview.baseUrl.match(
                          /^https?:\/\/([^.]+)\.local-credentialless\.webcontainer-api\.io/
                        );
                        if (!match) {
                          console.warn("[Preview] Invalid WebContainer URL:", activePreview.baseUrl);
                          return;
                        }
                        const previewId = match[1];
                        const previewUrl = `/webcontainer/preview/${previewId}`;
                        window.open(
                          previewUrl,
                          `preview-${previewId}`,
                          "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes"
                        );
                      },
                      children: [
                        /* @__PURE__ */ jsx("span", { children: t("preview.open_new_window", "Open in new window") }),
                        /* @__PURE__ */ jsx("div", { className: "i-ph:browser h-5 w-4" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-bolt-elements-textTertiary", children: t("preview.show_frame", "Show Device Frame") }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        className: classNames(
                          "w-10 h-5 rounded-full transition-colors duration-200 relative",
                          showDeviceFrame ? "bg-[#6D28D9]" : "bg-gray-300 dark:bg-gray-700"
                        ),
                        title: showDeviceFrame ? t("preview.hide_frame", "Hide Device Frame") : t("preview.show_frame", "Show Device Frame"),
                        onClick: (e) => {
                          e.stopPropagation();
                          setShowDeviceFrame(!showDeviceFrame);
                        },
                        children: /* @__PURE__ */ jsx(
                          "span",
                          {
                            className: classNames(
                              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200",
                              { "transform translate-x-5": showDeviceFrame }
                            )
                          }
                        )
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-bolt-elements-textTertiary", children: t("preview.landscape_mode", "Landscape Mode") }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        className: classNames(
                          "w-10 h-5 rounded-full transition-colors duration-200 relative",
                          isLandscape ? "bg-[#6D28D9]" : "bg-gray-300 dark:bg-gray-700"
                        ),
                        title: isLandscape ? t("preview.portrait_mode", "Portrait Mode") : t("preview.landscape_mode", "Landscape Mode"),
                        onClick: (e) => {
                          e.stopPropagation();
                          setIsLandscape(!isLandscape);
                        },
                        children: /* @__PURE__ */ jsx(
                          "span",
                          {
                            className: classNames(
                              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200",
                              { "transform translate-x-5": isLandscape }
                            )
                          }
                        )
                      }
                    )
                  ] })
                ] })
              ] }),
              windowSizes.map((size) => /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "w-full px-4 py-3.5 text-left text-[#111827] dark:text-gray-300 text-sm whitespace-nowrap flex items-center gap-3 group hover:bg-[#F5EEFF] dark:hover:bg-gray-900 bg-white dark:bg-black",
                  onClick: () => {
                    setSelectedWindowSize(size);
                    setIsWindowSizeDropdownOpen(false);
                    openInNewWindow(size);
                  },
                  children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: `${size.icon} w-5 h-5 text-[#6B7280] dark:text-gray-400 group-hover:text-[#6D28D9] dark:group-hover:text-[#6D28D9] transition-colors duration-200`
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { className: "flex-grow flex flex-col", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-medium group-hover:text-[#6D28D9] dark:group-hover:text-[#6D28D9] transition-colors duration-200", children: size.name }),
                      /* @__PURE__ */ jsxs("span", { className: "text-xs text-[#6B7280] dark:text-gray-400 group-hover:text-[#6D28D9] dark:group-hover:text-[#6D28D9] transition-colors duration-200", children: [
                        isLandscape && (size.frameType === "mobile" || size.frameType === "tablet") ? `${size.height} × ${size.width}` : `${size.width} × ${size.height}`,
                        size.hasFrame && showDeviceFrame ? " (with frame)" : ""
                      ] })
                    ] }),
                    selectedWindowSize.name === size.name && /* @__PURE__ */ jsx("div", { className: "text-[#6D28D9] dark:text-[#6D28D9]", children: /* @__PURE__ */ jsx(
                      "svg",
                      {
                        xmlns: "http://www.w3.org/2000/svg",
                        width: "16",
                        height: "16",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" })
                      }
                    ) })
                  ]
                },
                size.name
              ))
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 border-t border-bolt-elements-borderColor flex justify-center items-center overflow-auto", children: /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          width: isDeviceModeOn ? showDeviceFrameInPreview ? "100%" : `${widthPercent}%` : "100%",
          height: "100%",
          overflow: "auto",
          background: "var(--bolt-elements-background-depth-1)",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        },
        children: [
          activePreview ? /* @__PURE__ */ jsx(Fragment, { children: isDeviceModeOn && showDeviceFrameInPreview ? /* @__PURE__ */ jsx(
            "div",
            {
              className: "device-wrapper",
              style: {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                padding: "0",
                overflow: "auto",
                transition: "all 0.3s ease",
                position: "relative"
              },
              children: /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "device-frame-container",
                  style: {
                    position: "relative",
                    borderRadius: selectedWindowSize.frameType === "mobile" ? "36px" : "20px",
                    background: getFrameColor(),
                    padding: getFramePadding(),
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                    overflow: "hidden",
                    transform: "scale(1)",
                    transformOrigin: "center center",
                    transition: "all 0.3s ease",
                    margin: "40px",
                    width: isLandscape ? `${selectedWindowSize.height + (selectedWindowSize.frameType === "mobile" ? 120 : 60)}px` : `${selectedWindowSize.width + (selectedWindowSize.frameType === "mobile" ? 40 : 60)}px`,
                    height: isLandscape ? `${selectedWindowSize.width + (selectedWindowSize.frameType === "mobile" ? 80 : 60)}px` : `${selectedWindowSize.height + (selectedWindowSize.frameType === "mobile" ? 80 : 100)}px`
                  },
                  children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          position: "absolute",
                          top: isLandscape ? "50%" : "20px",
                          left: isLandscape ? "30px" : "50%",
                          transform: isLandscape ? "translateY(-50%)" : "translateX(-50%)",
                          width: isLandscape ? "8px" : selectedWindowSize.frameType === "mobile" ? "60px" : "80px",
                          height: isLandscape ? selectedWindowSize.frameType === "mobile" ? "60px" : "80px" : "8px",
                          background: "#333",
                          borderRadius: "4px",
                          zIndex: 2
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          position: "absolute",
                          bottom: isLandscape ? "50%" : "15px",
                          right: isLandscape ? "30px" : "50%",
                          transform: isLandscape ? "translateY(50%)" : "translateX(50%)",
                          width: isLandscape ? "4px" : "40px",
                          height: isLandscape ? "40px" : "4px",
                          background: "#333",
                          borderRadius: "50%",
                          zIndex: 2
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "iframe",
                      {
                        ref: iframeRef,
                        title: "preview",
                        style: {
                          border: "none",
                          width: isLandscape ? `${selectedWindowSize.height}px` : `${selectedWindowSize.width}px`,
                          height: isLandscape ? `${selectedWindowSize.width}px` : `${selectedWindowSize.height}px`,
                          background: "white",
                          display: "block"
                        },
                        src: iframeUrl,
                        sandbox: "allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin",
                        allow: "cross-origin-isolated"
                      }
                    )
                  ]
                }
              )
            }
          ) : /* @__PURE__ */ jsx(
            "iframe",
            {
              ref: iframeRef,
              title: "preview",
              className: "border-none w-full h-full bg-bolt-elements-background-depth-1",
              src: iframeUrl,
              sandbox: "allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin",
              allow: "geolocation; ch-ua-full-version-list; cross-origin-isolated; screen-wake-lock; publickey-credentials-get; shared-storage-select-url; ch-ua-arch; bluetooth; compute-pressure; ch-prefers-reduced-transparency; deferred-fetch; usb; ch-save-data; publickey-credentials-create; shared-storage; deferred-fetch-minimal; run-ad-auction; ch-ua-form-factors; ch-downlink; otp-credentials; payment; ch-ua; ch-ua-model; ch-ect; autoplay; camera; private-state-token-issuance; accelerometer; ch-ua-platform-version; idle-detection; private-aggregation; interest-cohort; ch-viewport-height; local-fonts; ch-ua-platform; midi; ch-ua-full-version; xr-spatial-tracking; clipboard-read; gamepad; display-capture; keyboard-map; join-ad-interest-group; ch-width; ch-prefers-reduced-motion; browsing-topics; encrypted-media; gyroscope; serial; ch-rtt; ch-ua-mobile; window-management; unload; ch-dpr; ch-prefers-color-scheme; ch-ua-wow64; attribution-reporting; fullscreen; identity-credentials-get; private-state-token-redemption; hid; ch-ua-bitness; storage-access; sync-xhr; ch-device-memory; ch-viewport-width; picture-in-picture; magnetometer; clipboard-write; microphone"
            }
          ) }) : /* @__PURE__ */ jsx("div", { className: "flex w-full h-full justify-center items-center bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary", children: "No preview available" }),
          isDeviceModeOn && !showDeviceFrameInPreview && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  position: "absolute",
                  top: "-25px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--bolt-elements-background-depth-3, rgba(0,0,0,0.7))",
                  color: "var(--bolt-elements-textPrimary, white)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  pointerEvents: "none",
                  opacity: resizingState.current.isResizing ? 1 : 0,
                  transition: "opacity 0.3s"
                },
                children: [
                  currentWidth,
                  "px"
                ]
              }
            ),
            /* @__PURE__ */ jsx(ResizeHandle, { side: "left" }),
            /* @__PURE__ */ jsx(ResizeHandle, { side: "right" })
          ] }),
          isPreviewMode && /* @__PURE__ */ jsxs(
            "div",
            {
              style: {
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "rgba(5, 150, 105, 0.9)",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                zIndex: 1e3,
                pointerEvents: "none"
              },
              children: [
                /* @__PURE__ */ jsx("span", { className: "i-ph:eye" }),
                "PREVIEW MODE"
              ]
            }
          )
        ]
      }
    ) })
  ] });
});

export { Preview, requestPreviewScreenshot };
