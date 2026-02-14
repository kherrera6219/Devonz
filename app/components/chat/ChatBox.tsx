import * as React from 'react';
import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { CombinedModelSelector } from '~/components/chat/CombinedModelSelector';
import { useSettings } from '~/lib/hooks/useSettings';
import FilePreview from './FilePreview';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { SupabaseConnection } from './SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import { Dialog, DialogRoot, DialogTitle, DialogDescription } from '~/components/ui/Dialog';
import styles from './BaseChat.module.scss';
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { McpTools } from './MCPTools';

import { useTranslation } from 'react-i18next';
import type { ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/lib/modules/llm/types';

interface ChatBoxProps {
  isModelSettingsCollapsed: boolean;
  setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  provider: ProviderInfo | undefined;
  providerList: ProviderInfo[];
  modelList: ModelInfo[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const { t } = useTranslation();

  // Check if current provider has API key set
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const { orchestratorSettings } = useSettings();

  return (
    <div
      className={classNames(
        'relative p-4 rounded-xl w-full max-w-chat mx-auto z-prompt',
        'border border-[#3d5a7f]/40',
        'shadow-xl shadow-[#1e3a5f]/20',
        'bg-[linear-gradient(145deg,rgba(30,58,95,0.15),rgba(26,26,26,0.95))] backdrop-blur-[24px]',
      )}
    >
      {/* Model Selector Modal/Popout */}
      <DialogRoot open={isModelSelectorOpen} onOpenChange={setIsModelSelectorOpen}>
        <Dialog
          className="w-[90vw] max-w-[500px] p-0 overflow-hidden"
          showCloseButton={false}
          onBackdrop={() => setIsModelSelectorOpen(false)}
        >
          {/* Visually hidden title and description for accessibility */}
          <DialogTitle className="sr-only">{t('chat.select_model_title', 'Select AI Model and Provider')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('chat.select_model_desc', 'Choose an AI provider and model for your chat session')}
          </DialogDescription>
          <CombinedModelSelector
            key={props.provider?.name + ':' + props.modelList.length}
            model={props.model}
            setModel={props.setModel}
            modelList={props.modelList}
            provider={props.provider}
            setProvider={props.setProvider}
            providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
            apiKeys={props.apiKeys}
            modelLoading={props.isModelLoading}
            isOpen={isModelSelectorOpen}
            onOpenChange={setIsModelSelectorOpen}
            hideTrigger={true}
          />
        </Dialog>
      </DialogRoot>
      <svg className={classNames(styles.PromptEffectContainer)}>
        <defs>
          <linearGradient
            id="line-gradient"
            x1="20%"
            y1="0%"
            x2="-14%"
            y2="10%"
            gradientUnits="userSpaceOnUse"
            gradientTransform="rotate(-45)"
          >
            <stop offset="0%" stopColor="#3d5a7f" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#3d5a7f" stopOpacity="40%"></stop>
            <stop offset="50%" stopColor="#4d6a8f" stopOpacity="40%"></stop>
            <stop offset="100%" stopColor="#3d5a7f" stopOpacity="0%"></stop>
          </linearGradient>
          <linearGradient id="shine-gradient">
            <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#ffffff" stopOpacity="40%"></stop>
            <stop offset="50%" stopColor="#ffffff" stopOpacity="40%"></stop>
            <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
          </linearGradient>
        </defs>
        <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
        <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
      </svg>

      <FilePreview
        files={props.uploadedFiles}
        imageDataList={props.imageDataList}
        onRemove={(index: number) => {
          props.setUploadedFiles?.(props.uploadedFiles.filter((_: File, i: number) => i !== index));
          props.setImageDataList?.(props.imageDataList.filter((_: string, i: number) => i !== index));
        }}
      />
      {props.selectedElement && (
        <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-bolt-elements-borderColor text-bolt-elements-textPrimary flex py-1 px-2.5 font-medium text-xs">
          <div className="flex gap-2 items-center lowercase">
            <code className="bg-accent-500 rounded-4px px-1.5 py-1 mr-0.5 text-white">
              {props?.selectedElement?.tagName}
            </code>
            {t('chat.selected_for_inspection', 'selected for inspection')}
          </div>
          <button
            className="bg-transparent text-accent-500 pointer-auto"
            onClick={() => props.setSelectedElement?.(null)}
          >
            {t('chat.clear', 'Clear')}
          </button>
        </div>
      )}
      <div
        className={classNames('relative shadow-xs border border-bolt-elements-borderColor backdrop-blur rounded-lg')}
      >
        <textarea
          ref={props.textareaRef}
          className={classNames(
            'w-full pl-4 pt-4 pr-16 outline-none resize-none text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent text-sm',
            'transition-all duration-200',
            'hover:border-bolt-elements-focus',
          )}
          aria-label={t('chat.input_label', 'Chat input')}
          onDragEnter={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #1488fc';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #1488fc';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';

            const files = Array.from(e.dataTransfer.files);
            files.forEach((file) => {
              if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                  const base64Image = e.target?.result as string;
                  props.setUploadedFiles?.([...props.uploadedFiles, file]);
                  props.setImageDataList?.([...props.imageDataList, base64Image]);
                };
                reader.readAsDataURL(file);
              }
            });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              if (event.shiftKey) {
                return;
              }

              event.preventDefault();

              if (props.isStreaming) {
                props.handleStop?.();
                return;
              }

              // ignore if using input method engine
              if (event.nativeEvent.isComposing) {
                return;
              }

              props.handleSendMessage?.(event);
            }
          }}
          value={props.input}
          onChange={(event) => {
            props.handleInputChange?.(event);
          }}
          onPaste={props.handlePaste}
          style={{
            minHeight: props.TEXTAREA_MIN_HEIGHT,
            maxHeight: props.TEXTAREA_MAX_HEIGHT,
          }}
          placeholder={
            props.chatMode === 'build'
              ? t('chat.ask_build', 'Ask Devonz to build...')
              : t('chat.ask_discuss', 'What would you like to discuss?')
          }
          translate="no"
        />
        <ClientOnly>
          {() => (
            <SendButton
              show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
              isStreaming={props.isStreaming}
              disabled={!props.providerList || props.providerList.length === 0}
              onClick={(event) => {
                if (props.isStreaming) {
                  props.handleStop?.();
                  return;
                }

                if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                  props.handleSendMessage?.(event);
                }
              }}
            />
          )}
        </ClientOnly>
        <div className="flex justify-between items-center text-sm p-4 pt-2">
          <div className="flex gap-1 items-center">
            <ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} />
            <McpTools />
            <IconButton
              title={t('chat.upload_file', 'Upload file')}
              className="transition-all"
              onClick={() => props.handleFileUpload()}
            >
              <div className="i-ph:paperclip text-xl"></div>
            </IconButton>
            <IconButton
              title={t('chat.enhance_prompt', 'Enhance prompt')}
              disabled={props.input.length === 0 || props.enhancingPrompt}
              className={classNames('transition-all', props.enhancingPrompt ? 'opacity-100' : '')}
              onClick={() => {
                props.enhancePrompt?.();
                toast.success(t('chat.prompt_enhanced', 'Prompt enhanced!'));
              }}
            >
              {props.enhancingPrompt ? (
                <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl animate-spin"></div>
              ) : (
                <div className="i-bolt:stars text-xl"></div>
              )}
            </IconButton>

            <SpeechRecognitionButton
              isListening={props.isListening}
              onStart={props.startListening}
              onStop={props.stopListening}
              disabled={props.isStreaming}
            />
            {props.chatStarted && (
              <IconButton
                title={t('chat.discuss', 'Discuss')}
                className={classNames(
                  'transition-all flex items-center gap-1 px-1.5',
                  props.chatMode === 'discuss'
                    ? '!bg-bolt-elements-item-backgroundAccent !text-bolt-elements-item-contentAccent'
                    : 'bg-bolt-elements-item-backgroundDefault text-bolt-elements-item-contentDefault',
                )}
                onClick={() => {
                  props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss');
                }}
              >
                <div className={`i-ph:chats text-xl`} />
                {props.chatMode === 'discuss' ? <span>{t('chat.discuss', 'Discuss')}</span> : <span />}
              </IconButton>
            )}
            {/* Model Selector Button with Dropdown */}
            <div className="flex items-center ml-1">
              <IconButton
                title={t('chat.select_model', 'Select Model')}
                className={classNames('transition-all flex items-center gap-1', {
                  'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent': isModelSelectorOpen,
                  'bg-bolt-elements-item-backgroundDefault text-bolt-elements-item-contentDefault':
                    !isModelSelectorOpen,
                })}
                onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                disabled={!props.providerList || props.providerList.length === 0}
              >
                <div className="i-ph:robot text-lg" />
              </IconButton>
              {props.model && (
                <button
                  onClick={() => setIsModelSelectorOpen(true)}
                  className="flex flex-col items-start ml-1.5 px-2 py-0.5 rounded-md bg-bolt-elements-item-backgroundDefault border border-bolt-elements-borderColor shadow-sm hover:bg-bolt-elements-item-backgroundActive transition-colors cursor-pointer"
                >
                  <span className="text-[9px] uppercase font-bold text-bolt-elements-textTertiary leading-tight cursor-inherit">
                    {props.provider?.name || t('common.ai', 'AI')}
                  </span>
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-[10px] font-medium text-bolt-elements-textPrimary truncate max-w-[120px] cursor-inherit">
                      {props.model}
                    </span>
                    {orchestratorSettings.enabled && (
                      <span className="text-[8px] font-black text-purple-400 uppercase tracking-tighter px-1 rounded bg-purple-500/10 border border-purple-500/20">
                        {t('chat.multi_agent', 'Multi-Agent')}
                      </span>
                    )}
                  </div>
                </button>
              )}
            </div>
          </div>
          {props.input.length > 3 ? (
            <div
              className="text-xs text-bolt-elements-textTertiary"
              dangerouslySetInnerHTML={{
                __html: t(
                  'chat.shift_return_new_line',
                  'Use <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Shift</kbd> + <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Return</kbd> for a new line',
                ),
              }}
            />
          ) : null}
          <SupabaseConnection />
          <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
        </div>
      </div>
    </div>
  );
};
