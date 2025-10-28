package com.siku;

import com.siku.controller.AuthControllerTest;
import com.siku.integration.AuthIntegrationTest;
import com.siku.integration.SecurityAuditIntegrationTest;
import com.siku.integration.UserIntegrationTest;
import com.siku.service.CaptchaServiceTest;
import com.siku.service.SecurityAuditServiceTest;
import com.siku.utils.AESHelperTest;
import com.siku.utils.RSAHelperTest;
import com.siku.utils.SecurityUtilsTest;
import org.junit.platform.suite.api.SelectClasses;
import org.junit.platform.suite.api.Suite;
import org.junit.platform.suite.api.SuiteDisplayName;

/**
 * 测试套件 - 运行所有测试
 */
@Suite
@SuiteDisplayName("Secure API System Test Suite")
@SelectClasses({
        // 工具类测试
        SecurityUtilsTest.class,
        AESHelperTest.class,
        RSAHelperTest.class,
        
        // 服务层测试
        CaptchaServiceTest.class,
        SecurityAuditServiceTest.class,
        
        // 控制器测试
        AuthControllerTest.class,
        
        // 集成测试
        AuthIntegrationTest.class,
        UserIntegrationTest.class,
        SecurityAuditIntegrationTest.class
})
public class TestSuite {
    // 测试套件类，用于组织所有测试
}