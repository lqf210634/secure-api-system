package com.siku.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 统一API响应格式
 * 
 * @author SiKu Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    /**
     * 响应状态码
     */
    private Integer code;
    
    /**
     * 响应消息
     */
    private String message;
    
    /**
     * 响应数据
     */
    private T data;
    
    /**
     * 响应时间戳
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    /**
     * 请求追踪ID
     */
    private String traceId;
    
    /**
     * 分页信息（当data为分页数据时）
     */
    private PageInfo pageInfo;
    
    // ==================== 静态工厂方法 ====================
    
    /**
     * 成功响应（无数据）
     */
    public static <T> ApiResponse<T> success() {
        return ApiResponse.<T>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }
    
    /**
     * 成功响应（带数据）
     */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(data)
                .build();
    }
    
    /**
     * 成功响应（带数据和消息）
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(message)
                .data(data)
                .build();
    }
    
    /**
     * 成功响应（分页数据）
     */
    public static <T> ApiResponse<T> success(T data, PageInfo pageInfo) {
        return ApiResponse.<T>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(data)
                .pageInfo(pageInfo)
                .build();
    }
    
    /**
     * 错误响应
     */
    public static <T> ApiResponse<T> error(ErrorCode errorCode) {
        return ApiResponse.<T>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
    }
    
    /**
     * 错误响应（自定义消息）
     */
    public static <T> ApiResponse<T> error(ErrorCode errorCode, String message) {
        return ApiResponse.<T>builder()
                .code(errorCode.getCode())
                .message(message)
                .build();
    }
    
    /**
     * 错误响应（自定义代码和消息）
     */
    public static <T> ApiResponse<T> error(Integer code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .build();
    }
    
    /**
     * 参数验证错误响应
     */
    public static <T> ApiResponse<T> validationError(String message) {
        return ApiResponse.<T>builder()
                .code(ErrorCode.VALIDATION_FAILED.getCode())
                .message(message)
                .build();
    }
    
    /**
     * 业务逻辑错误响应
     */
    public static <T> ApiResponse<T> businessError(String message) {
        return ApiResponse.<T>builder()
                .code(ErrorCode.BUSINESS_ERROR.getCode())
                .message(message)
                .build();
    }
    
    // ==================== 便捷方法 ====================
    
    /**
     * 判断响应是否成功
     */
    public boolean isSuccess() {
        return ErrorCode.SUCCESS.getCode().equals(this.code);
    }
    
    /**
     * 判断响应是否失败
     */
    public boolean isError() {
        return !isSuccess();
    }
    
    /**
     * 设置追踪ID
     */
    public ApiResponse<T> withTraceId(String traceId) {
        this.traceId = traceId;
        return this;
    }
    
    /**
     * 分页信息内部类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PageInfo {
        
        /**
         * 当前页码
         */
        private Integer currentPage;
        
        /**
         * 每页大小
         */
        private Integer pageSize;
        
        /**
         * 总记录数
         */
        private Long totalCount;
        
        /**
         * 总页数
         */
        private Integer totalPages;
        
        /**
         * 是否有下一页
         */
        private Boolean hasNext;
        
        /**
         * 是否有上一页
         */
        private Boolean hasPrevious;
        
        /**
         * 创建分页信息
         */
        public static PageInfo of(Integer currentPage, Integer pageSize, Long totalCount) {
            int totalPages = (int) Math.ceil((double) totalCount / pageSize);
            
            return PageInfo.builder()
                    .currentPage(currentPage)
                    .pageSize(pageSize)
                    .totalCount(totalCount)
                    .totalPages(totalPages)
                    .hasNext(currentPage < totalPages)
                    .hasPrevious(currentPage > 1)
                    .build();
        }
    }
}